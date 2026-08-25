// ...existing code...
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    // drop redundant unique indexes if present (try/catch to be idempotent)
    try {
      await queryInterface.removeIndex("products", ["slug"]);
    } catch (e) {}
    try {
      await queryInterface.removeIndex("products", ["sku"]);
    } catch (e) {}

    // create pg_trgm extension (may require elevated privileges)
    try {
      await sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    } catch (err) {
      console.warn(
        "pg_trgm creation skipped (needs DB privileges):",
        err
      );
    }

    // create trigram indexes for ILIKE performance (safe if extension exists)
    try {
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);`
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING GIN (description gin_trgm_ops);`
      );
    } catch (err) {
      console.warn("Could not create trigram indexes:", err.message);
    }

    // Safely convert search_keywords text -> JSONB:
    try {
      // 1) add temp JSONB column
      await sequelize.query(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS search_keywords_jsonb JSONB DEFAULT '[]'::jsonb;`
      );

      // 2) populate temp column only when existing value looks like JSON; otherwise default to []
      await sequelize.query(`
        UPDATE products
        SET search_keywords_jsonb = CASE
          WHEN search_keywords IS NULL OR trim(search_keywords) = '' THEN '[]'::jsonb
          WHEN search_keywords ~ '^[[:space:]]*\\[' THEN search_keywords::jsonb
          WHEN search_keywords ~ '^[[:space:]]*\\{' THEN search_keywords::jsonb
          ELSE '[]'::jsonb
        END
      `);

      // 3) drop old column and rename temp -> search_keywords
      await sequelize.query(
        `ALTER TABLE products DROP COLUMN IF EXISTS search_keywords;`
      );
      await sequelize.query(
        `ALTER TABLE products RENAME COLUMN search_keywords_jsonb TO search_keywords;`
      );
    } catch (err) {
      console.error("search_keywords -> JSONB migration failed:", err.message);
      throw err;
    }

    // create GIN index on JSONB search_keywords
    try {
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_search_keywords_gin ON products USING GIN (search_keywords);`
      );
    } catch (err) {
      console.warn("Could not create search_keywords GIN index:", err.message);
    }

    // indexes for ordering / common predicates
    try {
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);`
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_featured_true ON products (created_at) WHERE featured = true;`
      );
      await sequelize.query(
        `CREATE INDEX IF NOT EXISTS idx_products_status_active ON products (created_at) WHERE status = 'active';`
      );
    } catch (err) {
      console.warn(
        "Could not create created_at / partial indexes:",
        err.message
      );
    }

    // lightweight equality indexes if useful
    try {
      await queryInterface.addIndex("products", ["status"]);
    } catch (e) {}
    try {
      await queryInterface.addIndex("products", ["in_stock"]);
    } catch (e) {}
    try {
      await queryInterface.addIndex("products", ["condition"]);
    } catch (e) {}

    // indexes used by aggregate queries
    try {
      await queryInterface.addIndex(
        "product_variants",
        ["product_id", "price"],
        { name: "idx_product_variants_product_id_price" }
      );
    } catch (e) {}
    try {
      await queryInterface.addIndex("reviews", ["product_id"], {
        name: "idx_reviews_product_id",
      });
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;

    // drop indexes created above
    await sequelize.query(`DROP INDEX IF EXISTS idx_products_name_trgm;`);
    await sequelize.query(
      `DROP INDEX IF EXISTS idx_products_description_trgm;`
    );
    await sequelize.query(  
      `DROP INDEX IF EXISTS idx_products_search_keywords_gin;`
    );
    await sequelize.query(`DROP INDEX IF EXISTS idx_products_created_at;`);
    await sequelize.query(`DROP INDEX IF EXISTS idx_products_featured_true;`);
    await sequelize.query(`DROP INDEX IF EXISTS idx_products_status_active;`);

    // revert search_keywords JSONB -> TEXT (best-effort)
    try {
      await sequelize.query(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS search_keywords_text TEXT;`
      );
      await sequelize.query(
        `UPDATE products SET search_keywords_text = COALESCE(search_keywords::text, '[]');`
      );
      await sequelize.query(
        `ALTER TABLE products DROP COLUMN IF EXISTS search_keywords;`
      );
      await sequelize.query(
        `ALTER TABLE products RENAME COLUMN search_keywords_text TO search_keywords;`
      );
    } catch (err) {
      console.warn(
        "Could not revert search_keywords to TEXT automatically:",
        err.message
      );
    }

    // remove lightweight equality indexes
    try {
      await queryInterface.removeIndex("products", ["status"]);
    } catch (e) {}
    try {
      await queryInterface.removeIndex("products", ["in_stock"]);
    } catch (e) {}
    try {
      await queryInterface.removeIndex("products", ["condition"]);
    } catch (e) {}

    // remove related-table indexes
    try {
      await queryInterface.removeIndex(
        "product_variants",
        "idx_product_variants_product_id_price"
      );
    } catch (e) {}
    try {
      await queryInterface.removeIndex("reviews", "idx_reviews_product_id");
    } catch (e) {}
  },
};
// ...existing code...
