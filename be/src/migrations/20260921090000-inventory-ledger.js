"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const sql = `
        SET LOCAL lock_timeout = '10s';
        SET LOCAL statement_timeout = '5min';
        LOCK TABLE products, product_variants IN SHARE ROW EXCLUSIVE MODE;
        -- inventory-phase: Create ledger tables
        CREATE TABLE inventory_transactions (
          id UUID PRIMARY KEY DEFAULT (md5(random()::text || clock_timestamp()::text)::uuid),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
          type VARCHAR(20) NOT NULL CHECK (type IN ('OPENING','IN','OUT','ADJUSTMENT','RETURN','RELEASE')),
          quantity_change INTEGER NOT NULL,
          previous_stock INTEGER NOT NULL CHECK (previous_stock >= 0),
          new_stock INTEGER NOT NULL CHECK (new_stock >= 0),
          created_by UUID,
          actor_name TEXT NOT NULL,
          source VARCHAR(40) NOT NULL,
          reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
          unit_cost NUMERIC(14,2) CHECK (unit_cost >= 0),
          currency VARCHAR(3) NOT NULL DEFAULT 'VND',
          order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
          order_item_id UUID REFERENCES order_items(id) ON DELETE RESTRICT,
          sku TEXT,
          product_name TEXT NOT NULL,
          request_key VARCHAR(120),
          created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
          CHECK (new_stock = previous_stock + quantity_change),
          CHECK ((type = 'OPENING' AND quantity_change >= 0) OR
                 (type IN ('IN','RETURN','RELEASE') AND quantity_change > 0) OR
                 (type = 'OUT' AND quantity_change < 0) OR
                 (type = 'ADJUSTMENT' AND quantity_change <> 0)),
          CHECK (type <> 'IN' OR unit_cost IS NOT NULL)
        );
        CREATE TABLE inventory_requests (
          request_key VARCHAR(120) PRIMARY KEY,
          fingerprint TEXT NOT NULL,
          result JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        ALTER TABLE products ADD CONSTRAINT inventory_product_stock_nonnegative CHECK (stock_quantity IS NOT NULL AND stock_quantity >= 0);
        ALTER TABLE product_variants ADD CONSTRAINT inventory_variant_stock_nonnegative CHECK (stock_quantity IS NOT NULL AND stock_quantity >= 0);

        -- inventory-phase: Reconcile changed product totals
        -- Aggregate once and avoid rewriting unchanged products and their indexes.
        WITH totals AS (
          SELECT product_id, SUM(stock_quantity)::integer AS quantity
          FROM product_variants GROUP BY product_id
        )
        UPDATE products p SET stock_quantity = totals.quantity, is_variant_product = true
        FROM totals WHERE p.id = totals.product_id
          AND (p.stock_quantity IS DISTINCT FROM totals.quantity
            OR p.is_variant_product IS DISTINCT FROM true);
        -- inventory-phase: Reconcile changed availability
        UPDATE products SET in_stock=(stock_quantity > 0)
          WHERE in_stock IS DISTINCT FROM (stock_quantity > 0);
        -- inventory-phase: Record opening balances
        INSERT INTO inventory_transactions(product_id,variant_id,type,quantity_change,previous_stock,new_stock,actor_name,source,reason,sku,product_name)
          SELECT id,NULL,'OPENING',stock_quantity,0,stock_quantity,'System','MIGRATION','Số dư tại thời điểm bắt đầu theo dõi',sku,name
          FROM products WHERE NOT COALESCE(is_variant_product,false);
        INSERT INTO inventory_transactions(product_id,variant_id,type,quantity_change,previous_stock,new_stock,actor_name,source,reason,sku,product_name)
          SELECT product_id,id,'OPENING',stock_quantity,0,stock_quantity,'System','MIGRATION','Số dư tại thời điểm bắt đầu theo dõi',sku,name FROM product_variants;

        -- inventory-phase: Create history indexes and audit triggers
        CREATE INDEX inventory_history_time ON inventory_transactions(created_at DESC, id);
        CREATE INDEX inventory_history_product ON inventory_transactions(product_id, created_at DESC);
        CREATE INDEX inventory_history_variant ON inventory_transactions(variant_id, created_at DESC);
        CREATE INDEX inventory_history_order ON inventory_transactions(order_item_id, type);
        CREATE FUNCTION inventory_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Inventory history is append-only'; END $$;
        CREATE TRIGGER inventory_immutable BEFORE UPDATE OR DELETE ON inventory_transactions
          FOR EACH ROW EXECUTE FUNCTION inventory_immutable();
        CREATE TRIGGER inventory_no_truncate BEFORE TRUNCATE ON inventory_transactions
          FOR EACH STATEMENT EXECUTE FUNCTION inventory_immutable();

        CREATE FUNCTION inventory_audit_stock() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE ctx JSONB; before_qty INTEGER; delta INTEGER; pid UUID; vid UUID; kind TEXT;
        BEGIN
          IF TG_TABLE_NAME='products' THEN
            IF COALESCE(NEW.is_variant_product,false) THEN RETURN NEW; END IF;
            pid := NEW.id; vid := NULL;
          ELSE
            pid := NEW.product_id; vid := NEW.id;
          END IF;
          before_qty := CASE WHEN TG_OP='INSERT' THEN 0 ELSE OLD.stock_quantity END;
          delta := NEW.stock_quantity - before_qty;
          IF TG_OP='UPDATE' AND delta=0 THEN RETURN NEW; END IF;
          ctx := COALESCE(NULLIF(current_setting('app.inventory_context',true),'')::jsonb,'{}'::jsonb);
          IF delta<>0 AND NOT (ctx ? 'source') THEN
            RAISE EXCEPTION 'Stock changes require inventory transaction context';
          END IF;
          kind := CASE WHEN TG_OP='INSERT' THEN 'OPENING' ELSE COALESCE(ctx->>'type','ADJUSTMENT') END;
          INSERT INTO inventory_transactions(product_id,variant_id,type,quantity_change,previous_stock,new_stock,
            created_by,actor_name,source,reason,unit_cost,currency,order_id,order_item_id,sku,product_name,request_key)
          VALUES(pid,vid,kind,delta,before_qty,NEW.stock_quantity,
            NULLIF(ctx->>'createdBy','')::uuid,COALESCE(ctx->>'actorName','System'),COALESCE(ctx->>'source','CATALOG'),
            COALESCE(ctx->>'reason','Khởi tạo hàng hóa với tồn 0'),NULLIF(ctx->>'unitCost','')::numeric,'VND',
            NULLIF(ctx->>'orderId','')::uuid,NULLIF(ctx->>'orderItemId','')::uuid,NEW.sku,NEW.name,ctx->>'requestKey');
          RETURN NEW;
        END $$;
        CREATE TRIGGER inventory_product_audit AFTER INSERT OR UPDATE OF stock_quantity ON products
          FOR EACH ROW EXECUTE FUNCTION inventory_audit_stock();
        CREATE TRIGGER inventory_variant_audit AFTER INSERT OR UPDATE OF stock_quantity ON product_variants
          FOR EACH ROW EXECUTE FUNCTION inventory_audit_stock();

        CREATE FUNCTION inventory_product_guard() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP='UPDATE' AND OLD.is_variant_product IS DISTINCT FROM NEW.is_variant_product THEN
            RAISE EXCEPTION 'Cannot change inventory tracking mode; create a new product instead';
          END IF;
          IF TG_TABLE_NAME='products' THEN NEW.in_stock := NEW.stock_quantity > 0; END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER inventory_product_guard BEFORE UPDATE ON products
          FOR EACH ROW EXECUTE FUNCTION inventory_product_guard();
      `;
      // Keep every phase in the same transaction, but expose progress in CLI logs.
      for (const phase of sql.split(/\s*-- inventory-phase: /)) {
        const newline = phase.indexOf("\n");
        const isInitial = phase.trimStart().startsWith("SET LOCAL");
        const label = isInitial ? "Acquire inventory locks" : phase.slice(0, newline);
        console.log(`[Inventory migration] ${label}`);
        await queryInterface.sequelize.query(isInitial ? phase : phase.slice(newline + 1), { transaction });
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER inventory_product_guard ON products;
        DROP FUNCTION inventory_product_guard();
        DROP TRIGGER inventory_product_audit ON products;
        DROP TRIGGER inventory_variant_audit ON product_variants;
        DROP FUNCTION inventory_audit_stock();
        DROP TABLE inventory_requests;
        DROP TABLE inventory_transactions;
        DROP FUNCTION inventory_immutable();
        ALTER TABLE products DROP CONSTRAINT inventory_product_stock_nonnegative;
        ALTER TABLE product_variants DROP CONSTRAINT inventory_variant_stock_nonnegative;
      `, { transaction });
    });
  },
};
