"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_product_total_stock()
      RETURNS TRIGGER AS $$
      DECLARE
        product_id_to_update UUID;
      BEGIN
        -- Xác định ID sản phẩm cần cập nhật
        IF (TG_OP = 'DELETE') THEN 
          product_id_to_update := OLD.product_id;
        ELSE
          product_id_to_update := NEW.product_id;
        END IF;

        -- Cập nhật sản phẩm hiện tại
        IF product_id_to_update IS NOT NULL THEN 
          UPDATE products
          SET 
            stock_quantity = (
                SELECT COALESCE(SUM(stock_quantity), 0)
                FROM product_variants
                WHERE product_id = product_id_to_update
            ),
            in_stock = (
                SELECT COALESCE(SUM(stock_quantity), 0) > 0
                FROM product_variants
                WHERE product_id = product_id_to_update
            )
          WHERE id = product_id_to_update;
        END IF;
        
        -- Xử lý trường hợp đặc biệt: Cập nhật lại sản phẩm CŨ nếu variant bị đổi productId (UPDATE)
        IF (TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id) THEN
          UPDATE products
          SET 
            stock_quantity = (
              SELECT COALESCE(SUM(stock_quantity), 0)
              FROM product_variants
              WHERE product_id = OLD.product_id
            ),
            in_stock = (
              SELECT COALESCE(SUM(stock_quantity), 0) > 0
              FROM product_variants
              WHERE product_id = OLD.product_id
            )
          WHERE id = OLD.product_id;
        END IF;

        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER product_variants_stock_change_trigger
      AFTER INSERT OR UPDATE OF stock_quantity, product_id OR DELETE ON product_variants
      FOR EACH ROW
      EXECUTE FUNCTION update_product_total_stock();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DROP TRIGGER IF EXISTS product_variants_stock_change_trigger ON product_variants`
    );
    await queryInterface.sequelize.query(
      `DROP FUNCTION IF EXISTS update_product_total_stock()`
    );
  },
};
