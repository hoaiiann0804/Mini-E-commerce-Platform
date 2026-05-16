const { Product } = require("../src/models");
const slugify = require("slugify");

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

async function pruneProductsToTarget(targetCount, batchSize) {
  const sequelize = Product.sequelize;
  if (!sequelize) throw new Error("Missing sequelize instance on Product model");

  const target = Number(targetCount);
  const batch = Number(batchSize);
  if (!Number.isFinite(target) || target < 0) {
    throw new Error(`Invalid --target: ${targetCount}`);
  }
  if (!Number.isFinite(batch) || batch <= 0) {
    throw new Error(`Invalid --batch: ${batchSize}`);
  }

  const totalBefore = await Product.count();
  if (totalBefore <= target) {
    console.log(`[prune] Nothing to do. Current=${totalBefore}, target=${target}`);
    return;
  }

  console.log(`[prune] Start. Current=${totalBefore}, target=${target}`);

  while (true) {
    // Keep newest `target` products, delete the rest in batches.
    // Uses quoted "createdAt" because Sequelize timestamps are camelCase in Postgres.
    const [result] = await sequelize.query(
      `
      WITH doomed AS (
        SELECT id
        FROM products
        ORDER BY "createdAt" DESC
        OFFSET :target
        LIMIT :batch
      )
      DELETE FROM products
      WHERE id IN (SELECT id FROM doomed)
      RETURNING id;
      `,
      { replacements: { target, batch } }
    );

    const deleted = Array.isArray(result) ? result.length : 0;
    if (deleted === 0) break;
    console.log(`[prune] Deleted ${deleted} products...`);
  }

  const totalAfter = await Product.count();
  console.log(`[prune] Done. Current=${totalAfter}`);
}

async function generateProducts(totalToInsert, batchSize, sampleLimit) {
  const sample = Number(sampleLimit);
  if (!Number.isFinite(sample) || sample <= 0) {
    throw new Error(`Invalid --sample: ${sampleLimit}`);
  }

  const sourceProducts = await Product.findAll({
    attributes: ["name", "description", "shortDescription", "price"],
    limit: sample,
  });

  if (sourceProducts.length === 0) {
    console.error("Khong co san pham nao trong DB de lam mau!");
    return;
  }

  const TOTAL_TO_INSERT = Number(totalToInsert);
  const BATCH_SIZE = Number(batchSize);
  if (!Number.isFinite(TOTAL_TO_INSERT) || TOTAL_TO_INSERT <= 0) {
    throw new Error(`Invalid --total: ${totalToInsert}`);
  }
  if (!Number.isFinite(BATCH_SIZE) || BATCH_SIZE <= 0) {
    throw new Error(`Invalid --batch: ${batchSize}`);
  }

  const totalBatches = Math.ceil(TOTAL_TO_INSERT / BATCH_SIZE);
  console.log(
    `[generate] Start inserting ${TOTAL_TO_INSERT} products (batch=${BATCH_SIZE})...`
  );

  for (let b = 0; b < totalBatches; b++) {
    const clones = [];
    const currentBatchSize = Math.min(
      BATCH_SIZE,
      TOTAL_TO_INSERT - b * BATCH_SIZE
    );

    for (let i = 0; i < currentBatchSize; i++) {
      const random =
        sourceProducts[Math.floor(Math.random() * sourceProducts.length)];

      const uniqueSuffix = `${b}-${i}`;
      const name = `${random.name} ${uniqueSuffix}`;
      const baseSlug = slugify(name, {lower: true, strict: true})
      const uniqueSlug =`${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      clones.push({
        name,
        slug: uniqueSlug,
        description: random.description,
        shortDescription: random.shortDescription,
        price: random.price,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await Product.bulkCreate(clones, { logging: false });

    const inserted = Math.min((b + 1) * BATCH_SIZE, TOTAL_TO_INSERT);
    console.log(`[generate] Inserted: ${inserted} / ${TOTAL_TO_INSERT}`);
  }

  console.log("[generate] Done.");
}

async function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0] || "generate";

  if (cmd === "prune") {
    const target = args.target ?? 10000;
    const batch = args.batch ?? 5000;
    await pruneProductsToTarget(target, batch);
    return;
  }

  if (cmd === "generate") {
    const total = args.total ?? 10000;
    const batch = args.batch ?? 5000;
    const sample = args.sample ?? 100;
    await generateProducts(total, batch, sample);
    return;
  }

  console.log(`Unknown command: ${cmd}`);
  console.log(
    "Usage:\n  node be/scripts/generateProducts.js generate --total 10000 --batch 5000 --sample 100\n  node be/scripts/generateProducts.js prune --target 10000 --batch 5000"
  );
  process.exitCode = 1;
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});

