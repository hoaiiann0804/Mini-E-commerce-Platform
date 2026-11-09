-- psql -v apply=false -f repair-product-unique-indexes.sql (review)
-- psql -v apply=true  -f repair-product-unique-indexes.sql (after backup)
-- Only exact single-column btree UNIQUE duplicates for public.products sku/slug.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
LOCK TABLE public.products IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE inventory_index_repair_plan ON COMMIT DROP AS
WITH candidates AS (
  SELECT c.oid, c.conname, c.conindid, c.conkey, c.condeferrable, c.condeferred,
    a.attname,
    EXISTS(SELECT 1 FROM pg_constraint fk WHERE fk.contype='f' AND fk.conindid=c.conindid) AS referenced,
    substring(pg_get_indexdef(c.conindid) FROM ' ON .*$') AS definition
  FROM pg_constraint c
  JOIN pg_index i ON i.indexrelid=c.conindid
  JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
  WHERE c.conrelid='public.products'::regclass AND c.contype='u'
    AND cardinality(c.conkey)=1 AND a.attname IN ('sku','slug')
    AND i.indisunique AND i.indisvalid AND i.indisready
    AND i.indnatts=1 AND i.indnkeyatts=1 AND i.indpred IS NULL AND i.indexprs IS NULL
    AND NOT i.indisreplident AND NOT i.indisclustered
), ranked AS (
  SELECT *, row_number() OVER (
    PARTITION BY conkey, condeferrable, condeferred, definition
    ORDER BY referenced DESC, length(conname), conname
  ) AS position FROM candidates
)
SELECT conname, attname FROM ranked WHERE position>1 AND NOT referenced;
SELECT attname, count(*) AS redundant_constraints FROM inventory_index_repair_plan GROUP BY attname;
\if :apply
DO $$
DECLARE item RECORD;
BEGIN
  FOR item IN SELECT conname FROM inventory_index_repair_plan ORDER BY conname LOOP
    -- RESTRICT is intentional: unexpected dependencies abort the entire repair.
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I RESTRICT', item.conname);
  END LOOP;
END $$;
COMMIT;
\else
ROLLBACK;
\endif
