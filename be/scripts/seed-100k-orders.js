"use strict";

/**
 * Seed script for Best-Selling Products Benchmark
 * - Runs safety guard BEFORE connecting
 * - Uses isolated database `ecommerce_bench` in the same Docker Postgres container
 * - Fixed PRNG seed (mulberry32) for 100% deterministic, repeatable datasets
 * - Seeds 30,000 products (with active/inactive/draft status distribution)
 * - Seeds 100,000 orders (with realistic status distribution: ~65% delivered)
 * - Seeds ~200,000 order_items following Pareto 80/20 distribution (20% products -> ~80% order_items)
 * - Backfills `products.sold_count` from delivered orders and runs ANALYZE
 */

const {
  assertLocalBenchmarkEnvironment,
  ensureBenchmarkDatabase,
  createBenchmarkSequelize,
} = require("./db-guard");

// 1. Run guard immediately before doing anything else
const guardInfo = assertLocalBenchmarkEnvironment();

function parseArgs(argv) {
  const opts = {
    seed: Number(process.env.BENCH_SEED) || 20261124,
    products: Number(process.env.BENCH_PRODUCTS) || 30000,
    orders: Number(process.env.BENCH_ORDERS) || 100000,
    users: Number(process.env.BENCH_USERS) || 2000,
    batchSize: Number(process.env.BENCH_BATCH_SIZE) || 2500,
  };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--seed=")) opts.seed = Number(arg.split("=")[1]);
    else if (arg.startsWith("--products="))
      opts.products = Number(arg.split("=")[1]);
    else if (arg.startsWith("--orders="))
      opts.orders = Number(arg.split("=")[1]);
    else if (arg.startsWith("--users=")) opts.users = Number(arg.split("=")[1]);
    else if (arg.startsWith("--batch="))
      opts.batchSize = Number(arg.split("=")[1]);
  }
  return opts;
}

/**
 * Deterministic 32-bit PRNG (Mulberry32)
 */
function createMulberry32(seed) {
  let a = seed >>> 0;
  return function nextFloat() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic UUID-like v4 string from entity prefix and sequential index + seed
 */
function deterministicUuid(prefixHex, index) {
  const p = prefixHex.padStart(8, "0").slice(0, 8);
  const hi = ((index >>> 16) & 0xffff).toString(16).padStart(4, "0");
  const lo = (index & 0xffff).toString(16).padStart(4, "0");
  const tail = (index * 2654435761 >>> 0).toString(16).padStart(12, "0");
  return `${p}-${hi}-4${lo.slice(1)}-8${lo.slice(1)}-${tail}`;
}

/**
 * Recreates schema matching the project's Sequelize models (`products`, `users`, `orders`, `order_items`)
 * inside `ecommerce_bench` without any secondary benchmark indexes so benchmark script controls index state.
 */
async function recreateSchema(sequelize) {
  await sequelize.query(`
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    DROP TYPE IF EXISTS enum_products_status CASCADE;
    DROP TYPE IF EXISTS enum_products_condition CASCADE;
    DROP TYPE IF EXISTS enum_orders_status CASCADE;
    DROP TYPE IF EXISTS enum_orders_payment_status CASCADE;

    CREATE TYPE enum_products_status AS ENUM ('active', 'inactive', 'draft');
    CREATE TYPE enum_products_condition AS ENUM ('new', 'like-new', 'used', 'refurbished');
    CREATE TYPE enum_orders_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'expired');
    CREATE TYPE enum_orders_payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255),
      provider VARCHAR(32) NOT NULL DEFAULT 'local',
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64),
      role VARCHAR(32) DEFAULT 'customer',
      is_email_verified BOOLEAN DEFAULT true,
      "isActive" BOOLEAN DEFAULT true,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE products (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      short_description TEXT NOT NULL,
      price NUMERIC(12, 2) NOT NULL,
      compare_at_price NUMERIC(12, 2),
      images TEXT DEFAULT '[]',
      thumbnail TEXT,
      in_stock BOOLEAN DEFAULT true,
      stock_quantity INTEGER DEFAULT 0,
      sku TEXT UNIQUE,
      status enum_products_status DEFAULT 'active',
      featured BOOLEAN DEFAULT false,
      search_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT DEFAULT '[]',
      specifications TEXT DEFAULT '[]',
      condition enum_products_condition DEFAULT 'new',
      base_name TEXT,
      is_variant_product BOOLEAN DEFAULT false,
      avg_rating NUMERIC(3, 2) DEFAULT 0.00,
      review_count INTEGER DEFAULT 0,
      min_variant_price NUMERIC(12, 2),
      view_count INTEGER NOT NULL DEFAULT 0,
      sold_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE orders (
      id UUID PRIMARY KEY,
      number VARCHAR(255) NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status enum_orders_status DEFAULT 'pending',
      shipping_first_name VARCHAR(255) NOT NULL,
      shipping_last_name VARCHAR(255) NOT NULL,
      shipping_company VARCHAR(255),
      shipping_address1 VARCHAR(255) NOT NULL,
      shipping_address2 VARCHAR(255),
      shipping_city VARCHAR(255) NOT NULL,
      shipping_state VARCHAR(255) NOT NULL,
      shipping_zip VARCHAR(255) NOT NULL,
      shipping_country VARCHAR(255) NOT NULL,
      shipping_phone VARCHAR(255),
      billing_first_name VARCHAR(255) NOT NULL,
      billing_last_name VARCHAR(255) NOT NULL,
      billing_company VARCHAR(255),
      billing_address1 VARCHAR(255) NOT NULL,
      billing_address2 VARCHAR(255),
      billing_city VARCHAR(255) NOT NULL,
      billing_state VARCHAR(255) NOT NULL,
      billing_zip VARCHAR(255) NOT NULL,
      billing_country VARCHAR(255) NOT NULL,
      billing_phone VARCHAR(255),
      payment_method VARCHAR(255) NOT NULL,
      payment_status enum_orders_payment_status DEFAULT 'pending',
      payment_quote JSON,
      payment_transaction_id VARCHAR(255),
      payment_provider VARCHAR(255),
      subtotal NUMERIC(12, 2) NOT NULL,
      tax NUMERIC(12, 2) NOT NULL,
      shipping_cost NUMERIC(12, 2) NOT NULL,
      discount NUMERIC(12, 2) DEFAULT 0,
      total NUMERIC(12, 2) NOT NULL,
      notes TEXT,
      tracking_number VARCHAR(255),
      shipping_provider VARCHAR(255),
      estimated_delivery TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      coupon_id UUID,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE order_items (
      id UUID PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id UUID,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(255),
      price NUMERIC(12, 2) NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal NUMERIC(12, 2) NOT NULL,
      image VARCHAR(255),
      attributes JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function sqlLiteral(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "0";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const opts = parseArgs(process.argv);
  const startTime = Date.now();

  console.log("============================================================");
  console.log("[SEED] SAFETY GUARD & ENVIRONMENT CHECK");
  console.log("============================================================");
  console.log(`- NODE_ENV            : ${guardInfo.nodeEnv}`);
  console.log(`- Target Host:Port    : ${guardInfo.host}:${guardInfo.port}`);
  console.log(`- Target Benchmark DB : ${guardInfo.database}`);
  console.log(`- Dev DB (untouched)  : ${guardInfo.devDatabaseIgnored}`);
  console.log(`- Fixed Random Seed   : ${opts.seed}`);
  console.log(`- Target Products     : ${opts.products.toLocaleString()}`);
  console.log(`- Target Orders       : ${opts.orders.toLocaleString()}`);
  console.log("------------------------------------------------------------");

  const dbInfo = await ensureBenchmarkDatabase();
  console.log(
    `[SEED] Database "${dbInfo.database}" ready (newly created: ${dbInfo.created}).`
  );

  const sequelize = createBenchmarkSequelize(dbInfo);
  await sequelize.authenticate();

  try {
    const rng = createMulberry32(opts.seed);
    const baseEpochMs = Date.UTC(2025, 0, 1, 0, 0, 0);
    const oneYearMs = 365 * 24 * 3600 * 1000;

    console.log("[SEED] 1/5 Recreating clean schema in ecommerce_bench...");
    await recreateSchema(sequelize);

    // 2. Seed Users
    console.log(`[SEED] 2/5 Seeding ${opts.users.toLocaleString()} users...`);
    const userIds = new Array(opts.users);
    for (let start = 0; start < opts.users; start += opts.batchSize) {
      const end = Math.min(start + opts.batchSize, opts.users);
      const values = [];
      for (let i = start; i < end; i++) {
        const uid = deterministicUuid("10000000", i + 1);
        userIds[i] = uid;
        const ts = new Date(
          baseEpochMs + Math.floor(rng() * oneYearMs)
        ).toISOString();
        values.push(
          `(${sqlLiteral(uid)}, ${sqlLiteral(
            `bench.user.${i + 1}@example.local`
          )}, 'hashed_dummy_pw', 'local', ${sqlLiteral(
            `First${i + 1}`
          )}, ${sqlLiteral(`Last${i + 1}`)}, '0900000000', 'customer', TRUE, TRUE, 0, ${sqlLiteral(
            ts
          )}, ${sqlLiteral(ts)})`
        );
      }
      await sequelize.query(`
        INSERT INTO users (
          id, email, password, provider, first_name, last_name, phone, role,
          is_email_verified, "isActive", failed_login_attempts, created_at, updated_at
        ) VALUES ${values.join(",\n")};
      `);
    }

    // 3. Seed Products (30,000 products: ~75% active, ~15% inactive, ~10% draft)
    console.log(
      `[SEED] 3/5 Seeding ${opts.products.toLocaleString()} products (active/inactive/draft)...`
    );
    const productsMeta = new Array(opts.products);
    for (let start = 0; start < opts.products; start += opts.batchSize) {
      const end = Math.min(start + opts.batchSize, opts.products);
      const values = [];
      for (let i = start; i < end; i++) {
        const pid = deterministicUuid("20000000", i + 1);
        const statusRoll = rng();
        let status = "active";
        if (statusRoll >= 0.75 && statusRoll < 0.9) {
          status = "inactive";
        } else if (statusRoll >= 0.9) {
          status = "draft";
        }

        const price = Number((10 + Math.floor(rng() * 1990) + 0.99).toFixed(2));
        const compareAtPrice = Number((price * 1.15).toFixed(2));
        const avgRating = Number((3.0 + rng() * 2.0).toFixed(2));
        const reviewCount = Math.floor(rng() * 250);
        const viewCount = Math.floor(rng() * 15000);
        const stockQty = 50 + Math.floor(rng() * 500);
        const createdAt = new Date(
          baseEpochMs + Math.floor(rng() * oneYearMs)
        ).toISOString();
        const name = `Benchmark Product #${i + 1}`;
        const slug = `benchmark-product-${i + 1}`;
        const sku = `BENCH-SKU-${String(i + 1).padStart(6, "0")}`;

        productsMeta[i] = { id: pid, name, sku, price, status };

        values.push(
          `(${sqlLiteral(pid)}, ${sqlLiteral(name)}, ${sqlLiteral(
            slug
          )}, ${sqlLiteral(
            `Detailed description for ${name} designed for PostgreSQL indexing benchmark.`
          )}, ${sqlLiteral(
            `Short description for ${name}`
          )}, ${price}, ${compareAtPrice}, true, ${stockQty}, ${sqlLiteral(
            sku
          )}, ${sqlLiteral(
            status
          )}, false, ${avgRating}, ${reviewCount}, ${viewCount}, 0, ${sqlLiteral(
            createdAt
          )}, ${sqlLiteral(createdAt)})`
        );
      }

      await sequelize.query(`
        INSERT INTO products (
          id, name, slug, description, short_description, price, compare_at_price,
          in_stock, stock_quantity, sku, status, featured, avg_rating, review_count,
          view_count, sold_count, created_at, updated_at
        ) VALUES ${values.join(",\n")};
      `);
    }

    // 4. Seed 100,000 Orders + Order Items with Pareto 80/20 distribution
    // Top 20% of products (indices 0 .. top20Count-1) receive ~80% of order items
    // Remaining 80% of products (indices top20Count .. opts.products-1) receive ~20% of order items
    const top20Count = Math.max(1, Math.floor(opts.products * 0.2));
    const tail80Count = Math.max(1, opts.products - top20Count);

    console.log(
      `[SEED] 4/5 Seeding ${opts.orders.toLocaleString()} orders + order_items (Pareto 80/20 across ${top20Count.toLocaleString()} hot / ${tail80Count.toLocaleString()} tail products)...`
    );

    let totalOrderItemsInserted = 0;
    let itemSeq = 0;
    const cities = ["Ho Chi Minh", "Ha Noi", "Da Nang", "Can Tho", "Hai Phong"];
    const paymentMethods = ["stripe", "cod", "bank_transfer"];

    for (let start = 0; start < opts.orders; start += opts.batchSize) {
      const end = Math.min(start + opts.batchSize, opts.orders);
      const orderValues = [];
      const itemValues = [];

      for (let i = start; i < end; i++) {
        const orderId = deterministicUuid("30000000", i + 1);
        const orderNumber = `BENCH-ORD-${String(i + 1).padStart(7, "0")}`;
        const userId = userIds[Math.floor(rng() * userIds.length)];

        // Order status distribution (~65% delivered, 10% shipped, 8% processing, 7% pending, 10% cancelled)
        const sRoll = rng();
        let status = "delivered";
        let paymentStatus = "paid";
        if (sRoll < 0.65) {
          status = "delivered";
          paymentStatus = "paid";
        } else if (sRoll < 0.75) {
          status = "shipped";
          paymentStatus = "paid";
        } else if (sRoll < 0.83) {
          status = "processing";
          paymentStatus = "paid";
        } else if (sRoll < 0.9) {
          status = "pending";
          paymentStatus = "pending";
        } else {
          status = "cancelled";
          paymentStatus = "failed";
        }

        const createdAt = new Date(
          baseEpochMs + Math.floor(rng() * oneYearMs)
        ).toISOString();
        const city = cities[i % cities.length];
        const paymentMethod = paymentMethods[i % paymentMethods.length];

        // 1 to 3 items per order (average ~2.0 items -> ~200,000 order_items)
        const numItems = 1 + Math.floor(rng() * 3);
        let orderSubtotal = 0;

        for (let k = 0; k < numItems; k++) {
          itemSeq++;
          const itemId = deterministicUuid("40000000", itemSeq);

          // Pareto 80/20 selection:
          // 80% chance to pick from top 20% products (with power-law skew inside top 20%)
          // 20% chance to pick from remaining 80% products
          let prodIdx;
          if (rng() < 0.8) {
            const skewed = Math.pow(rng(), 2.0);
            prodIdx = Math.min(
              top20Count - 1,
              Math.floor(skewed * top20Count)
            );
          } else {
            prodIdx =
              top20Count +
              Math.min(tail80Count - 1, Math.floor(rng() * tail80Count));
          }

          const prod = productsMeta[prodIdx];
          const quantity = 1 + Math.floor(rng() * 3); // 1..3 units
          const itemSubtotal = Number((prod.price * quantity).toFixed(2));
          orderSubtotal += itemSubtotal;

          itemValues.push(
            `(${sqlLiteral(itemId)}, ${sqlLiteral(orderId)}, ${sqlLiteral(
              prod.id
            )}, ${sqlLiteral(prod.name)}, ${sqlLiteral(prod.sku)}, ${
              prod.price
            }, ${quantity}, ${itemSubtotal}, ${sqlLiteral(
              createdAt
            )}, ${sqlLiteral(createdAt)})`
          );
        }

        orderSubtotal = Number(orderSubtotal.toFixed(2));
        const tax = Number((orderSubtotal * 0.08).toFixed(2));
        const shippingCost = 5.0;
        const total = Number((orderSubtotal + tax + shippingCost).toFixed(2));

        orderValues.push(
          `(${sqlLiteral(orderId)}, ${sqlLiteral(orderNumber)}, ${sqlLiteral(
            userId
          )}, ${sqlLiteral(
            status
          )}, 'BenchFirst', 'BenchLast', '123 Benchmark St', ${sqlLiteral(
            city
          )}, 'VN-State', '70000', 'VN', '0901234567', 'BenchFirst', 'BenchLast', '123 Benchmark St', ${sqlLiteral(
            city
          )}, 'VN-State', '70000', 'VN', '0901234567', ${sqlLiteral(
            paymentMethod
          )}, ${sqlLiteral(
            paymentStatus
          )}, ${orderSubtotal}, ${tax}, ${shippingCost}, 0, ${total}, ${sqlLiteral(
            createdAt
          )}, ${sqlLiteral(createdAt)})`
        );
      }

      await sequelize.transaction(async (t) => {
        await sequelize.query(
          `
          INSERT INTO orders (
            id, number, user_id, status,
            shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_phone,
            billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_zip, billing_country, billing_phone,
            payment_method, payment_status, subtotal, tax, shipping_cost, discount, total, created_at, updated_at
          ) VALUES ${orderValues.join(",\n")};
          `,
          { transaction: t }
        );

        await sequelize.query(
          `
          INSERT INTO order_items (
            id, order_id, product_id, name, sku, price, quantity, subtotal, created_at, updated_at
          ) VALUES ${itemValues.join(",\n")};
          `,
          { transaction: t }
        );
      });

      totalOrderItemsInserted += itemValues.length;
      if ((end / opts.batchSize) % 8 === 0 || end === opts.orders) {
        console.log(
          `  -> Progress: ${end.toLocaleString()} / ${opts.orders.toLocaleString()} orders (${totalOrderItemsInserted.toLocaleString()} order_items)`
        );
      }
    }

    // 5. Backfill denormalized `products.sold_count` from delivered orders & ANALYZE
    console.log(
      "[SEED] 5/5 Backfilling products.sold_count (from status='delivered' orders) & running ANALYZE..."
    );
    await sequelize.query(`
      UPDATE products
      SET sold_count = 0;

      UPDATE products AS p
      SET sold_count = COALESCE(sales.total_sold, 0)
      FROM (
        SELECT
          oi.product_id,
          SUM(oi.quantity)::INTEGER AS total_sold
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        GROUP BY oi.product_id
      ) AS sales
      WHERE p.id = sales.product_id;

      ANALYZE users, products, orders, order_items;
    `);

    // 6. Query and print actual distribution statistics
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

    const [paretoAllItems] = await sequelize.query(`
      WITH ranked_products AS (
        SELECT
          p.id,
          COUNT(oi.id)::bigint AS item_rows,
          COALESCE(SUM(oi.quantity), 0)::bigint AS total_qty,
          NTILE(5) OVER (ORDER BY COUNT(oi.id) DESC, COALESCE(SUM(oi.quantity), 0) DESC, p.id) AS quintile
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id
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

    const [paretoDeliveredSoldCount] = await sequelize.query(`
      WITH ranked_sold AS (
        SELECT
          id,
          sold_count,
          NTILE(5) OVER (ORDER BY sold_count DESC, id) AS quintile
        FROM products
      )
      SELECT
        quintile,
        COUNT(*)::int AS product_count,
        SUM(sold_count)::bigint AS delivered_units_sold,
        ROUND(SUM(sold_count) * 100.0 / NULLIF(SUM(SUM(sold_count)) OVER (), 0), 2) AS sold_count_pct
      FROM ranked_sold
      GROUP BY quintile
      ORDER BY quintile ASC;
    `);

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n============================================================");
    console.log(`[SEED] COMPLETED IN ${elapsedSec}s — DISTRIBUTION SUMMARY`);
    console.log("============================================================");

    console.log("\n1) Products Status Distribution:");
    console.table(productStatusStats);

    console.log("\n2) Orders Status Distribution:");
    console.table(orderStatusStats);

    console.log(
      "\n3) Pareto 80/20 Distribution (All Order Items by Product Quintile, Quintile 1 = Top 20% Products):"
    );
    console.table(paretoAllItems);

    console.log(
      "\n4) Pareto 80/20 Distribution (Denormalized products.sold_count from Delivered Orders, Quintile 1 = Top 20%):"
    );
    console.table(paretoDeliveredSoldCount);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[SEED] ERROR:", err.message);
    process.exit(1);
  });
}

