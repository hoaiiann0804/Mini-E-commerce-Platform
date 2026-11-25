"use strict";

/**
 * Benchmark Script for Best-Selling Products Queries (PostgreSQL)
 *
 * Rules & Methodology:
 * 1. Runs DB guard BEFORE opening any connection; operates strictly on `ecommerce_bench`.
 * 2. Tests Query 1 (Denormalized `products.sold_count` query):
 *    - State 1a: NO index on `products` (besides PK/unique slug/sku)
 *    - State 1b: ONE composite B-tree index matching WHERE + ORDER BY:
 *      `CREATE INDEX idx_products_bestsellers_active_sort ON products (status, sold_count DESC, avg_rating DESC, created_at DESC)`
 *    - Does NOT force index scan (`enable_seqscan` remains default `on`). Reports planner's actual choice.
 * 3. Tests Query 2 (3 states comparing on-the-fly aggregation vs denormalized counter):
 *    - State 2a: JOIN `products` + `order_items` + `orders` + SUM(oi.quantity) WITHOUT FK/status indexes
 *    - State 2b: JOIN `products` + `order_items` + `orders` + SUM(oi.quantity) WITH FK/status indexes
 *    - State 2c: Reading denormalized `products.sold_count` (with the composite B-tree index)
 * 4. For each state:
 *    - Saves full `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` output to `docs/plans/<state>.txt`
 *    - Executes `EXPLAIN (ANALYZE, BUFFERS)` 10 times, discards Run #1 (warm-up), computes Median (p50) and P95
 *      over Runs #2..#10 (warm cache) using PostgreSQL's reported `Execution Time` as primary metric
 *      and Node.js `process.hrtime.bigint()` as secondary reference.
 * 5. Writes factual report with real numbers only to `docs/benchmark.md`.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  assertLocalBenchmarkEnvironment,
  createBenchmarkSequelize,
} = require("./db-guard");

// Run safety guard BEFORE any DB connection
const guardInfo = assertLocalBenchmarkEnvironment();

const ROOT_DIR = path.resolve(__dirname, "../..");
const DOCS_DIR = path.join(ROOT_DIR, "docs");
const PLANS_DIR = path.join(DOCS_DIR, "plans");
const REPORT_PATH = path.join(DOCS_DIR, "benchmark.md");

const TOTAL_RUNS = 10;

const QUERY_1_DENORMALIZED_SQL = `
SELECT
  id,
  name,
  slug,
  price,
  sold_count,
  avg_rating,
  created_at
FROM products
WHERE status = 'active'
ORDER BY sold_count DESC, avg_rating DESC, created_at DESC
LIMIT 10
`.trim();

const QUERY_2_JOIN_SUM_SQL = `
SELECT
  p.id,
  p.name,
  p.slug,
  p.price,
  SUM(oi.quantity)::integer AS units_sold,
  p.avg_rating,
  p.created_at
FROM products p
INNER JOIN order_items oi ON p.id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
  AND p.status = 'active'
GROUP BY p.id, p.name, p.slug, p.price, p.avg_rating, p.created_at
ORDER BY units_sold DESC, p.avg_rating DESC, p.created_at DESC
LIMIT 10
`.trim();

function computeStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { median: 0, p95: 0, min: 0, max: 0, mean: 0 };

  const mid = Math.floor(n / 2);
  const median =
    n % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(3));

  // Linear interpolation for p95 on 9 samples (or nearest-rank index ceil(0.95*n)-1)
  const pos = 0.95 * (n - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  const weight = pos - lower;
  const p95 = Number(
    (sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(3)
  );

  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = Number((sum / n).toFixed(3));

  return {
    median: Number(median.toFixed(3)),
    p95,
    min: Number(sorted[0].toFixed(3)),
    max: Number(sorted[n - 1].toFixed(3)),
    mean,
    sorted,
  };
}

function parseExplainOutput(lines) {
  const fullText = lines.join("\n");
  let planningTimeMs = null;
  let executionTimeMs = null;

  for (const line of lines) {
    const planMatch = line.match(/Planning Time:\s+([\d.]+)\s+ms/i);
    if (planMatch) planningTimeMs = Number(planMatch[1]);
    const execMatch = line.match(/Execution Time:\s+([\d.]+)\s+ms/i);
    if (execMatch) executionTimeMs = Number(execMatch[1]);
  }

  // Extract key plan node types (top node + scan/join/sort nodes)
  const nodeTypes = [];
  for (const line of lines) {
    const trimmed = line.replace(/^(\s*->\s*|\s+)/, "");
    const m = trimmed.match(
      /^(Limit|Sort|Gather Merge|Gather|HashAggregate|GroupAggregate|Partial HashAggregate|Finalize GroupAggregate|Hash Join|Nested Loop|Merge Join|Seq Scan|Parallel Seq Scan|Index Scan|Index Scan Backward|Index Only Scan|Bitmap Heap Scan|Bitmap Index Scan)\b([^\n(]*)/
    );
    if (m) {
      const nodeDesc = `${m[1]}${m[2] ? m[2].trimEnd() : ""}`.trim();
      if (!nodeTypes.includes(nodeDesc)) {
        nodeTypes.push(nodeDesc);
      }
    }
  }

  return {
    fullText,
    planningTimeMs,
    executionTimeMs,
    planSummary: nodeTypes.join(" -> "),
  };
}

async function runBenchmarkState(sequelize, stateConfig) {
  const { id, title, sql, planFileName, setupSql } = stateConfig;

  console.log(`\n------------------------------------------------------------`);
  console.log(`[BENCH] Setting up state: ${title}`);
  if (setupSql) {
    await sequelize.query(setupSql);
  }

  const runs = [];
  let savedPlanText = "";
  let savedPlanSummary = "";

  for (let i = 1; i <= TOTAL_RUNS; i++) {
    const hrStart = process.hrtime.bigint();
    const [rows] = await sequelize.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`
    );
    const hrEnd = process.hrtime.bigint();
    const hrTimeMs = Number(hrEnd - hrStart) / 1e6;

    const lines = rows.map((r) => r["QUERY PLAN"] || Object.values(r)[0]);
    const parsed = parseExplainOutput(lines);

    if (parsed.executionTimeMs === null) {
      throw new Error(
        `Failed to parse "Execution Time" from EXPLAIN ANALYZE output on run #${i}`
      );
    }

    // Save the warm-cache plan (Run #2) to disk
    if (i === 2) {
      savedPlanText = parsed.fullText;
      savedPlanSummary = parsed.planSummary;
    }

    runs.push({
      run: i,
      discardedWarmup: i === 1,
      executionTimeMs: Number(parsed.executionTimeMs.toFixed(3)),
      planningTimeMs:
        parsed.planningTimeMs !== null
          ? Number(parsed.planningTimeMs.toFixed(3))
          : 0,
      hrTimeMs: Number(hrTimeMs.toFixed(3)),
    });
  }

  const planFilePath = path.join(PLANS_DIR, planFileName);
  fs.writeFileSync(planFilePath, savedPlanText + "\n", "utf8");

  const warmRuns = runs.slice(1); // Discard Run #1
  const execStats = computeStats(warmRuns.map((r) => r.executionTimeMs));
  const planStats = computeStats(warmRuns.map((r) => r.planningTimeMs));
  const hrStats = computeStats(warmRuns.map((r) => r.hrTimeMs));

  console.log(`[BENCH] ${title}`);
  console.log(`  Plan Type : ${savedPlanSummary}`);
  console.log(`  Plan File : docs/plans/${planFileName}`);
  console.log(
    `  Run #1 (discarded warm-up): Execution Time = ${runs[0].executionTimeMs.toFixed(
      3
    )} ms (hrtime = ${runs[0].hrTimeMs.toFixed(3)} ms)`
  );
  console.log(
    `  Runs #2..#10 Execution Time (ms): [${warmRuns
      .map((r) => r.executionTimeMs.toFixed(3))
      .join(", ")}]`
  );
  console.log(
    `  => EXPLAIN Execution Time (Warm Cache, 9 runs): Median = ${execStats.median.toFixed(
      3
    )} ms | P95 = ${execStats.p95.toFixed(3)} ms (Min=${execStats.min.toFixed(
      3
    )}, Max=${execStats.max.toFixed(3)})`
  );
  console.log(
    `  => Reference Client hrtime (Warm Cache, 9 runs): Median = ${hrStats.median.toFixed(
      3
    )} ms | P95 = ${hrStats.p95.toFixed(3)} ms`
  );

  return {
    id,
    title,
    sql,
    planFileName,
    planSummary: savedPlanSummary,
    planText: savedPlanText,
    runs,
    warmRuns,
    execStats,
    planStats,
    hrStats,
  };
}

async function main() {
  fs.mkdirSync(PLANS_DIR, { recursive: true });

  console.log("============================================================");
  console.log("[BENCH] SAFETY GUARD & ENVIRONMENT CHECK");
  console.log("============================================================");
  console.log(`- NODE_ENV            : ${guardInfo.nodeEnv}`);
  console.log(`- Target Host:Port    : ${guardInfo.host}:${guardInfo.port}`);
  console.log(`- Target Benchmark DB : ${guardInfo.database}`);
  console.log(`- Dev DB (untouched)  : ${guardInfo.devDatabaseIgnored}`);

  const sequelize = createBenchmarkSequelize(guardInfo);
  await sequelize.authenticate();

  try {
    // 1. Collect Environment & Dataset Metadata
    const [[pgVerRow]] = await sequelize.query(
      `SELECT version() AS full_version, current_setting('server_version') AS server_version, current_setting('shared_buffers') AS shared_buffers, current_setting('work_mem') AS work_mem, current_setting('effective_cache_size') AS effective_cache_size, current_setting('enable_seqscan') AS enable_seqscan;`
    );

    const [[countsRow]] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users_count,
        (SELECT COUNT(*)::int FROM products) AS products_count,
        (SELECT COUNT(*)::int FROM orders) AS orders_count,
        (SELECT COUNT(*)::int FROM order_items) AS order_items_count;
    `);

    if (countsRow.orders_count === 0 || countsRow.products_count === 0) {
      throw new Error(
        `Database "${guardInfo.database}" has 0 orders or products. Please run "node scripts/seed-100k-orders.js" first.`
      );
    }

    const [productStatusStats] = await sequelize.query(`
      SELECT
        status::text AS status,
        COUNT(*)::int AS count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct
      FROM products
      GROUP BY status
      ORDER BY count DESC;
    `);

    const [orderStatusStats] = await sequelize.query(`
      SELECT
        status::text AS status,
        COUNT(*)::int AS count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct
      FROM orders
      GROUP BY status
      ORDER BY count DESC;
    `);

    const [paretoStats] = await sequelize.query(`
      WITH ranked_products AS (
        SELECT
          p.id,
          p.sold_count,
          COUNT(oi.id)::bigint AS item_rows,
          COALESCE(SUM(oi.quantity), 0)::bigint AS total_qty,
          NTILE(5) OVER (ORDER BY COUNT(oi.id) DESC, COALESCE(SUM(oi.quantity), 0) DESC, p.id) AS quintile
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id, p.sold_count
      )
      SELECT
        quintile,
        COUNT(*)::int AS product_count,
        SUM(item_rows)::bigint AS order_item_rows,
        ROUND(SUM(item_rows) * 100.0 / NULLIF(SUM(SUM(item_rows)) OVER (), 0), 2) AS order_items_pct,
        SUM(total_qty)::bigint AS units_ordered,
        ROUND(SUM(total_qty) * 100.0 / NULLIF(SUM(SUM(total_qty)) OVER (), 0), 2) AS units_pct
      FROM ranked_products
      GROUP BY quintile
      ORDER BY quintile ASC;
    `);

    console.log(
      `- PostgreSQL Version  : ${pgVerRow.server_version} (${pgVerRow.full_version.split(",")[0]})`
    );
    console.log(
      `- Postgres Settings   : shared_buffers=${pgVerRow.shared_buffers}, work_mem=${pgVerRow.work_mem}, enable_seqscan=${pgVerRow.enable_seqscan}`
    );
    console.log(
      `- Row Counts          : products=${countsRow.products_count.toLocaleString()}, orders=${countsRow.orders_count.toLocaleString()}, order_items=${countsRow.order_items_count.toLocaleString()}, users=${countsRow.users_count.toLocaleString()}`
    );

    // =========================================================================
    // BENCHMARK SUITE
    // =========================================================================

    // Clean all custom benchmark indexes first to guarantee clean baseline
    const dropAllBenchmarkIndexesSql = `
      DROP INDEX IF EXISTS idx_products_bestsellers_active_sort;
      DROP INDEX IF EXISTS idx_orders_status;
      DROP INDEX IF EXISTS idx_order_items_order_id;
      DROP INDEX IF EXISTS idx_order_items_product_id;
    `;

    // --- Query 1: Denormalized counter on `products` ---
    // State 1a: No index on products
    const q1NoIndex = await runBenchmarkState(sequelize, {
      id: "q1_no_index",
      title: "Query 1 (a) — Denormalized Counter (products.sold_count) WITHOUT Index",
      sql: QUERY_1_DENORMALIZED_SQL,
      planFileName: "q1_no_index.txt",
      setupSql: `
        ${dropAllBenchmarkIndexesSql}
        ANALYZE products;
      `,
    });

    // State 1b: With single composite B-tree index matching WHERE + ORDER BY
    const q1WithIndex = await runBenchmarkState(sequelize, {
      id: "q1_with_index",
      title:
        "Query 1 (b) — Denormalized Counter (products.sold_count) WITH Composite B-tree Index",
      sql: QUERY_1_DENORMALIZED_SQL,
      planFileName: "q1_with_index.txt",
      setupSql: `
        ${dropAllBenchmarkIndexesSql}
        CREATE INDEX idx_products_bestsellers_active_sort
          ON products USING btree (status, sold_count DESC, avg_rating DESC, created_at DESC);
        ANALYZE products;
      `,
    });

    // --- Query 2: 3 States comparing JOIN+SUM vs Denormalized sold_count ---
    // State 2a: JOIN + SUM without FK/status indexes
    const q2aNoFkIndex = await runBenchmarkState(sequelize, {
      id: "q2a_join_sum_no_fk_index",
      title: "Query 2 (a) — JOIN + SUM(oi.quantity) WITHOUT FK / Status Indexes",
      sql: QUERY_2_JOIN_SUM_SQL,
      planFileName: "q2a_join_sum_no_fk_index.txt",
      setupSql: `
        ${dropAllBenchmarkIndexesSql}
        ANALYZE products, orders, order_items;
      `,
    });

    // State 2b: JOIN + SUM with FK and status B-tree indexes
    const q2bWithFkIndex = await runBenchmarkState(sequelize, {
      id: "q2b_join_sum_with_fk_index",
      title: "Query 2 (b) — JOIN + SUM(oi.quantity) WITH FK & Status Indexes",
      sql: QUERY_2_JOIN_SUM_SQL,
      planFileName: "q2b_join_sum_with_fk_index.txt",
      setupSql: `
        CREATE INDEX idx_orders_status ON orders USING btree (status);
        CREATE INDEX idx_order_items_order_id ON order_items USING btree (order_id);
        CREATE INDEX idx_order_items_product_id ON order_items USING btree (product_id);
        CREATE INDEX idx_products_bestsellers_active_sort
          ON products USING btree (status, sold_count DESC, avg_rating DESC, created_at DESC);
        ANALYZE products, orders, order_items;
      `,
    });

    // State 2c: Reading denormalized `sold_count` with index
    const q2cDenormalized = await runBenchmarkState(sequelize, {
      id: "q2c_denormalized_sold_count",
      title:
        "Query 2 (c) — Denormalized Counter (products.sold_count) WITH Composite B-tree Index",
      sql: QUERY_1_DENORMALIZED_SQL,
      planFileName: "q2c_denormalized_sold_count.txt",
      setupSql: `
        ANALYZE products;
      `,
    });

    // =========================================================================
    // GENERATE docs/benchmark.md WITH REAL MEASURED NUMBERS ONLY
    // =========================================================================
    const envSummaryShort = `PostgreSQL ${pgVerRow.server_version} (Docker), Node ${process.version}, ${os.platform()}/${os.arch()}, Warm Cache (shared_buffers=${pgVerRow.shared_buffers}, work_mem=${pgVerRow.work_mem})`;
    const rowCountSummaryShort = `products: ${countsRow.products_count.toLocaleString()}<br>orders: ${countsRow.orders_count.toLocaleString()}<br>order_items: ${countsRow.order_items_count.toLocaleString()}`;

    const formatRunsTable = (stateResult) => {
      const header = `| Run | Trạng thái | EXPLAIN Execution Time (ms) | EXPLAIN Planning Time (ms) | Client hrtime (ms - tham khảo) |\n| :---: | :--- | ---: | ---: | ---: |`;
      const rows = stateResult.runs.map((r) => {
        const label = r.discardedWarmup
          ? "Warm-up (bỏ qua)"
          : "Tính vào Median/P95 (Warm Cache)";
        return `| #${r.run} | ${label} | ${r.executionTimeMs.toFixed(
          3
        )} | ${r.planningTimeMs.toFixed(3)} | ${r.hrTimeMs.toFixed(3)} |`;
      });
      return [header, ...rows].join("\n");
    };

    const markdown = `# Báo cáo Benchmark Tối ưu Truy vấn Best-Selling Products (PostgreSQL)

## 1. Môi trường & Cấu hình Thực nghiệm

- **Database**: \`${guardInfo.database}\` (cô lập hoàn toàn với DB dev \`${guardInfo.devDatabaseIgnored}\` trong cùng container Docker \`e-commerce-postgres\`)
- **PostgreSQL Version**: \`${pgVerRow.full_version}\`
- **PostgreSQL Settings**:
  - \`shared_buffers\`: \`${pgVerRow.shared_buffers}\`
  - \`work_mem\`: \`${pgVerRow.work_mem}\`
  - \`effective_cache_size\`: \`${pgVerRow.effective_cache_size}\`
  - \`enable_seqscan\`: \`${pgVerRow.enable_seqscan}\` (giữ mặc định, không ép planner)
- **Container Limits (\`ops/docker/docker-compose.dev.yml\`)**: \`cpus: 0.5\`, \`mem_limit: 1g\`
- **Node.js Runtime**: \`${process.version}\` trên \`${os.type()} ${os.release()} (${os.arch()})\`, Host CPU: \`${os.cpus()[0]?.model || "N/A"}\`
- **Phương pháp đo**:
  - Mỗi trạng thái chạy **10 lần liên tiếp** câu lệnh \`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\`.
  - **Loại bỏ lần chạy đầu tiên (Run #1 - warm-up)**; tính **Median (p50)** và **P95** trên **9 lần chạy còn lại (Runs #2..#10)** ở trạng thái **Warm Cache** (dữ liệu đã nằm trong PostgreSQL \`shared_buffers\` / OS page cache).
  - **Số đo chính thức**: Lấy trực tiếp từ \`Execution Time\` của \`EXPLAIN (ANALYZE, BUFFERS)\` do PostgreSQL engine báo cáo. Thời gian \`process.hrtime.bigint()\` ở tầng Node.js client được ghi kèm để tham khảo.

---

## 2. Thống kê Dữ liệu Seed (\`SEED = 20261124\`)

- **Tổng số dòng các bảng**:
  - \`users\`: **${countsRow.users_count.toLocaleString()}**
  - \`products\`: **${countsRow.products_count.toLocaleString()}**
  - \`orders\`: **${countsRow.orders_count.toLocaleString()}**
  - \`order_items\`: **${countsRow.order_items_count.toLocaleString()}**

### 2.1. Phân phối trạng thái bảng \`products\`
| \`products.status\` | Số dòng | Tỷ lệ (%) |
| :--- | ---: | ---: |
${productStatusStats
  .map((r) => `| \`${r.status}\` | ${Number(r.count).toLocaleString()} | ${r.pct}% |`)
  .join("\n")}

### 2.2. Phân phối trạng thái bảng \`orders\`
| \`orders.status\` | Số dòng | Tỷ lệ (%) |
| :--- | ---: | ---: |
${orderStatusStats
  .map((r) => `| \`${r.status}\` | ${Number(r.count).toLocaleString()} | ${r.pct}% |`)
  .join("\n")}

### 2.3. Kiểm chứng phân phối Pareto 80/20 trên \`order_items\`
| Nhóm phân vị sản phẩm (Quintile = 20% số SP) | Số lượng SP | Số dòng \`order_items\` | Tỷ lệ \`order_items\` (%) | Tổng \`quantity\` đặt | Tỷ lệ \`quantity\` (%) |
| :---: | ---: | ---: | ---: | ---: | ---: |
${paretoStats
  .map(
    (r) =>
      `| Quintile ${r.quintile} ${
        Number(r.quintile) === 1 ? "(Top 20% Hot)" : ""
      } | ${Number(r.product_count).toLocaleString()} | ${Number(
        r.order_item_rows
      ).toLocaleString()} | ${r.order_items_pct}% | ${Number(
        r.units_ordered
      ).toLocaleString()} | ${r.units_pct}% |`
  )
  .join("\n")}

---

## 3. Bảng Tổng hợp Kết quả Benchmark (Warm Cache — 9 runs sau khi bỏ Run #1)

### 3.1. Bảng so sánh Trước / Sau cho Query 1 (Denormalized Counter \`products.sold_count\`)

| Môi trường | Số dòng | Query | Trước (ms) — Không Index | Sau (ms) — Có Composite B-tree Index | Plan Type (Trước → Sau) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ${envSummaryShort} | ${rowCountSummaryShort} | **Query 1**: Lấy Top 10 \`products\` (\`WHERE status = 'active' ORDER BY sold_count DESC, avg_rating DESC, created_at DESC LIMIT 10\`) | **Median**: \`${q1NoIndex.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q1NoIndex.execStats.p95.toFixed(3)} ms\`<br>*(hrtime Median: ${q1NoIndex.hrStats.median.toFixed(3)} ms)* | **Median**: \`${q1WithIndex.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q1WithIndex.execStats.p95.toFixed(3)} ms\`<br>*(hrtime Median: ${q1WithIndex.hrStats.median.toFixed(3)} ms)* | **Trước**: \`${q1NoIndex.planSummary}\`<br>**Sau**: \`${q1WithIndex.planSummary}\` |

### 3.2. Bảng so sánh 3 Trạng thái cho Query 2 (\`JOIN + SUM\` không Index FK vs \`JOIN + SUM\` có Index FK vs Đọc \`sold_count\`)

| Môi trường | Số dòng | Query / Trạng thái | Trước (ms) | Sau (ms) | Plan Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ${envSummaryShort} | ${rowCountSummaryShort} | **Query 2 (a)**: \`JOIN products + order_items + orders\` + \`SUM(oi.quantity)\` **KHÔNG có Index FK/status** | **Median**: \`${q2aNoFkIndex.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q2aNoFkIndex.execStats.p95.toFixed(3)} ms\`<br>*(hrtime Median: ${q2aNoFkIndex.hrStats.median.toFixed(3)} ms)* | — *(Baseline 2a)* | \`${q2aNoFkIndex.planSummary}\` |
| ${envSummaryShort} | ${rowCountSummaryShort} | **Query 2 (b)**: \`JOIN products + order_items + orders\` + \`SUM(oi.quantity)\` **CÓ Index FK & status** (so với 2a) | **Median**: \`${q2aNoFkIndex.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q2aNoFkIndex.execStats.p95.toFixed(3)} ms\` | **Median**: \`${q2bWithFkIndex.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q2bWithFkIndex.execStats.p95.toFixed(3)} ms\`<br>*(hrtime Median: ${q2bWithFkIndex.hrStats.median.toFixed(3)} ms)* | \`${q2bWithFkIndex.planSummary}\` |
| ${envSummaryShort} | ${rowCountSummaryShort} | **Query 2 (c)**: Đọc trực tiếp **denormalized \`products.sold_count\`** có Composite B-tree Index (so với 2b) | **Median**: \`${q2bWithFkIndex.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q2bWithFkIndex.execStats.p95.toFixed(3)} ms\` | **Median**: \`${q2cDenormalized.execStats.median.toFixed(3)} ms\`<br>**P95**: \`${q2cDenormalized.execStats.p95.toFixed(3)} ms\`<br>*(hrtime Median: ${q2cDenormalized.hrStats.median.toFixed(3)} ms)* | \`${q2cDenormalized.planSummary}\` |

---

## 4. Thiết kế Composite B-tree Index cho Query 1 & Giải thích Kỹ thuật

Cho Query 1:
\`\`\`sql
${QUERY_1_DENORMALIZED_SQL};
\`\`\`

Chỉ **một** B-tree index duy nhất được tạo cho Query 1:
\`\`\`sql
CREATE INDEX idx_products_bestsellers_active_sort
  ON products USING btree (status, sold_count DESC, avg_rating DESC, created_at DESC);
\`\`\`

### Vì sao chọn thứ tự cột và hướng sắp xếp \`(status, sold_count DESC, avg_rating DESC, created_at DESC)\`?
1. **Quy tắc Equality Prefix trước, Sort Columns sau**:
   - Cột \`status\` nằm trong mệnh đề lọc bằng (\`WHERE status = 'active'\`) nên phải đặt ở **vị trí đầu tiên (leading column)** của B-tree. Nhờ vậy, PostgreSQL định vị ngay phân vùng các lá index chỉ chứa \`status = 'active'\`.
2. **Thứ tự các cột tiếp theo khớp chính xác mệnh đề \`ORDER BY\`**:
   - Trong phạm vi các bản ghi có \`status = 'active'\`, các khóa trong B-tree đã được sắp sẵn lần lượt theo \`sold_count DESC\`, nếu bằng nhau thì xét tiếp \`avg_rating DESC\`, và tiếp tục tie-break theo \`created_at DESC\`.
3. **Tại sao phải chỉ định rõ hướng \`DESC\` cho cả 3 cột sort?**:
   - PostgreSQL có thể quét ngược một B-tree index (\`Index Scan Backward\`) nếu tất cả các cột \`ORDER BY\` đều ngược chiều hoàn toàn với chiều khai báo trong index. Tuy nhiên, việc khai báo tường minh \`(status, sold_count DESC, avg_rating DESC, created_at DESC)\` giúp khớp trực tiếp chiều quét thuận (\`Index Scan\`), đồng thời tránh lỗi lệch pha chiều sắp xếp (mixed directions) nếu sau này kết hợp các cột có chiều \`ASC\`/\`DESC\` khác nhau.
4. **Hiệu quả với \`LIMIT 10\` (Early Termination / Avoid Sort)**:
   - Khi không có index này, PostgreSQL phải thực hiện \`Seq Scan\` quét toàn bộ **${countsRow.products_count.toLocaleString()}** dòng của bảng \`products\`, lọc \`status = 'active'\`, rồi đưa vào bộ nhớ để chạy \`Sort (top-N heapsort)\`.
   - Khi có composite index này, PostgreSQL đọc thẳng **10 tuple hợp lệ đầu tiên** theo thứ tự lá của B-tree và dừng ngay lập tức (\`Limit -> Index Scan\`), hoàn toàn loại bỏ bước \`Sort\`.

---

## 5. Chi tiết 10 Lần chạy (Runs #1..#10) và \`EXPLAIN (ANALYZE, BUFFERS)\`

### 5.1. Query 1 (a) — \`products.sold_count\` KHÔNG có Index
- File plan: \`docs/plans/${q1NoIndex.planFileName}\`
- **Median (Runs #2..#10)**: \`${q1NoIndex.execStats.median.toFixed(3)} ms\` | **P95**: \`${q1NoIndex.execStats.p95.toFixed(3)} ms\`

${formatRunsTable(q1NoIndex)}

\`\`\`text
${q1NoIndex.planText}
\`\`\`

### 5.2. Query 1 (b) — \`products.sold_count\` CÓ Composite B-tree Index
- File plan: \`docs/plans/${q1WithIndex.planFileName}\`
- **Median (Runs #2..#10)**: \`${q1WithIndex.execStats.median.toFixed(3)} ms\` | **P95**: \`${q1WithIndex.execStats.p95.toFixed(3)} ms\`

${formatRunsTable(q1WithIndex)}

\`\`\`text
${q1WithIndex.planText}
\`\`\`

### 5.3. Query 2 (a) — \`JOIN + SUM(oi.quantity)\` KHÔNG có Index FK/status
- File plan: \`docs/plans/${q2aNoFkIndex.planFileName}\`
- **Median (Runs #2..#10)**: \`${q2aNoFkIndex.execStats.median.toFixed(3)} ms\` | **P95**: \`${q2aNoFkIndex.execStats.p95.toFixed(3)} ms\`

${formatRunsTable(q2aNoFkIndex)}

\`\`\`text
${q2aNoFkIndex.planText}
\`\`\`

### 5.4. Query 2 (b) — \`JOIN + SUM(oi.quantity)\` CÓ Index FK & status
- File plan: \`docs/plans/${q2bWithFkIndex.planFileName}\`
- **Median (Runs #2..#10)**: \`${q2bWithFkIndex.execStats.median.toFixed(3)} ms\` | **P95**: \`${q2bWithFkIndex.execStats.p95.toFixed(3)} ms\`

${formatRunsTable(q2bWithFkIndex)}

\`\`\`text
${q2bWithFkIndex.planText}
\`\`\`

### 5.5. Query 2 (c) — Đọc trực tiếp \`products.sold_count\` CÓ Composite B-tree Index
- File plan: \`docs/plans/${q2cDenormalized.planFileName}\`
- **Median (Runs #2..#10)**: \`${q2cDenormalized.execStats.median.toFixed(3)} ms\` | **P95**: \`${q2cDenormalized.execStats.p95.toFixed(3)} ms\`

${formatRunsTable(q2cDenormalized)}

\`\`\`text
${q2cDenormalized.planText}
\`\`\`

---

## 6. Hướng dẫn Lệnh chạy Từng bước để Tái lập (Reproducible Commands)

\`\`\`bash
# Bước 1: Đảm bảo container PostgreSQL đang chạy
docker compose -f ops/docker/docker-compose.dev.yml up -d db

# Bước 2: Di chuyển vào thư mục backend
cd be

# Bước 3: Chạy script seed (tự tạo DB riêng ecommerce_bench, cố định SEED=20261124,
#         seed 30,000 products + 100,000 orders + ~200,000 order_items theo Pareto 80/20)
npm run seed:100k
# Hoặc: node scripts/seed-100k-orders.js --seed=20261124 --products=30000 --orders=100000

# Bước 4: Chạy script benchmark (chạy 10 lần/trạng thái, bỏ lần đầu, lưu EXPLAIN ANALYZE
#         vào docs/plans/*.txt và tự động ghi báo cáo ra docs/benchmark.md)
npm run benchmark:bestsellers
# Hoặc: node scripts/benchmark-bestsellers.js
\`\`\`
`;

    fs.writeFileSync(REPORT_PATH, markdown, "utf8");

    console.log("\n============================================================");
    console.log("[BENCH] SUMMARY TABLE (Warm Cache, 9 runs after discarding Run #1)");
    console.log("============================================================");
    console.table([
      {
        State: "Q1(a) sold_count - NO Index",
        "Median Exec (ms)": q1NoIndex.execStats.median,
        "P95 Exec (ms)": q1NoIndex.execStats.p95,
        "Median hrtime (ms)": q1NoIndex.hrStats.median,
        "Plan Type": q1NoIndex.planSummary,
      },
      {
        State: "Q1(b) sold_count - WITH Composite Index",
        "Median Exec (ms)": q1WithIndex.execStats.median,
        "P95 Exec (ms)": q1WithIndex.execStats.p95,
        "Median hrtime (ms)": q1WithIndex.hrStats.median,
        "Plan Type": q1WithIndex.planSummary,
      },
      {
        State: "Q2(a) JOIN+SUM - NO FK Index",
        "Median Exec (ms)": q2aNoFkIndex.execStats.median,
        "P95 Exec (ms)": q2aNoFkIndex.execStats.p95,
        "Median hrtime (ms)": q2aNoFkIndex.hrStats.median,
        "Plan Type": q2aNoFkIndex.planSummary,
      },
      {
        State: "Q2(b) JOIN+SUM - WITH FK Index",
        "Median Exec (ms)": q2bWithFkIndex.execStats.median,
        "P95 Exec (ms)": q2bWithFkIndex.execStats.p95,
        "Median hrtime (ms)": q2bWithFkIndex.hrStats.median,
        "Plan Type": q2bWithFkIndex.planSummary,
      },
      {
        State: "Q2(c) sold_count - WITH Composite Index",
        "Median Exec (ms)": q2cDenormalized.execStats.median,
        "P95 Exec (ms)": q2cDenormalized.execStats.p95,
        "Median hrtime (ms)": q2cDenormalized.hrStats.median,
        "Plan Type": q2cDenormalized.planSummary,
      },
    ]);
    console.log(`[BENCH] Report written to: ${REPORT_PATH}`);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[BENCH] ERROR:", err.message);
    process.exit(1);
  });
}

