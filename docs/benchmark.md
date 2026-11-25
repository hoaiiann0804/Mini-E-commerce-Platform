# Báo cáo Benchmark Tối ưu Truy vấn Best-Selling Products (PostgreSQL)

## 1. Môi trường & Cấu hình Thực nghiệm

- **Database**: `ecommerce_bench` (cô lập hoàn toàn với DB dev `websitebanhangmini` trong cùng container Docker `e-commerce-postgres`)
- **PostgreSQL Version**: `PostgreSQL 15.17 (Debian 15.17-1.pgdg13+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 14.2.0-19) 14.2.0, 64-bit`
- **PostgreSQL Settings**:
  - `shared_buffers`: `128MB`
  - `work_mem`: `4MB`
  - `effective_cache_size`: `4GB`
  - `enable_seqscan`: `on` (giữ mặc định, không ép planner)
- **Container Limits (`ops/docker/docker-compose.dev.yml`)**: `cpus: 0.5`, `mem_limit: 1g`
- **Node.js Runtime**: `v24.22.1` trên `Windows_NT 10.0.26200 (x64)`, Host CPU: `12th Gen Intel(R) Core(TM) i5-12450H`
- **Phương pháp đo**:
  - Mỗi trạng thái chạy **10 lần liên tiếp** câu lệnh `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)`.
  - **Loại bỏ lần chạy đầu tiên (Run #1 - warm-up)**; tính **Median (p50)** và **P95** trên **9 lần chạy còn lại (Runs #2..#10)** ở trạng thái **Warm Cache** (dữ liệu đã nằm trong PostgreSQL `shared_buffers` / OS page cache).
  - **Số đo chính thức**: Lấy trực tiếp từ `Execution Time` của `EXPLAIN (ANALYZE, BUFFERS)` do PostgreSQL engine báo cáo. Thời gian `process.hrtime.bigint()` ở tầng Node.js client được ghi kèm để tham khảo.

---

## 2. Thống kê Dữ liệu Seed (`SEED = 20261124`)

- **Tổng số dòng các bảng**:
  - `users`: **2,000**
  - `products`: **30,000**
  - `orders`: **100,000**
  - `order_items`: **199,524**

### 2.1. Phân phối trạng thái bảng `products`
| `products.status` | Số dòng | Tỷ lệ (%) |
| :--- | ---: | ---: |
| `active` | 22,480 | 74.93% |
| `inactive` | 4,479 | 14.93% |
| `draft` | 3,041 | 10.14% |

### 2.2. Phân phối trạng thái bảng `orders`
| `orders.status` | Số dòng | Tỷ lệ (%) |
| :--- | ---: | ---: |
| `delivered` | 65,098 | 65.10% |
| `cancelled` | 9,990 | 9.99% |
| `shipped` | 9,877 | 9.88% |
| `processing` | 8,026 | 8.03% |
| `pending` | 7,009 | 7.01% |

### 2.3. Kiểm chứng phân phối Pareto 80/20 trên `order_items`
| Nhóm phân vị sản phẩm (Quintile = 20% số SP) | Số lượng SP | Số dòng `order_items` | Tỷ lệ `order_items` (%) | Tổng `quantity` đặt | Tỷ lệ `quantity` (%) |
| :---: | ---: | ---: | ---: | ---: | ---: |
| Quintile 1 (Top 20% Hot) | 6,000 | 159,653 | 80.02% | 318,857 | 79.96% |
| Quintile 2  | 6,000 | 20,517 | 10.28% | 42,020 | 10.54% |
| Quintile 3  | 6,000 | 11,928 | 5.98% | 23,081 | 5.79% |
| Quintile 4  | 6,000 | 6,000 | 3.01% | 13,376 | 3.35% |
| Quintile 5  | 6,000 | 1,426 | 0.71% | 1,426 | 0.36% |

---

## 3. Bảng Tổng hợp Kết quả Benchmark (Warm Cache — 9 runs sau khi bỏ Run #1)

### 3.1. Bảng so sánh Trước / Sau cho Query 1 (Denormalized Counter `products.sold_count`)

| Môi trường | Số dòng | Query | Trước (ms) — Không Index | Sau (ms) — Có Composite B-tree Index | Plan Type (Trước → Sau) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PostgreSQL 15.17 (Debian 15.17-1.pgdg13+1) (Docker), Node v24.22.1, win32/x64, Warm Cache (shared_buffers=128MB, work_mem=4MB) | products: 30,000<br>orders: 100,000<br>order_items: 199,524 | **Query 1**: Lấy Top 10 `products` (`WHERE status = 'active' ORDER BY sold_count DESC, avg_rating DESC, created_at DESC LIMIT 10`) | **Median**: `9.528 ms`<br>**P95**: `39.665 ms`<br>*(hrtime Median: 10.831 ms)* | **Median**: `0.038 ms`<br>**P95**: `0.040 ms`<br>*(hrtime Median: 0.951 ms)* | **Trước**: `Limit -> Sort -> Sort Key: sold_count DESC, avg_rating DESC, created_at DESC -> Sort Method: top-N heapsort  Memory: 27kB -> Seq Scan on products`<br>**Sau**: `Limit -> Index Scan using idx_products_bestsellers_active_sort on products` |

### 3.2. Bảng so sánh 3 Trạng thái cho Query 2 (`JOIN + SUM` không Index FK vs `JOIN + SUM` có Index FK vs Đọc `sold_count`)

| Môi trường | Số dòng | Query / Trạng thái | Trước (ms) | Sau (ms) | Plan Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| PostgreSQL 15.17 (Debian 15.17-1.pgdg13+1) (Docker), Node v24.22.1, win32/x64, Warm Cache (shared_buffers=128MB, work_mem=4MB) | products: 30,000<br>orders: 100,000<br>order_items: 199,524 | **Query 2 (a)**: `JOIN products + order_items + orders` + `SUM(oi.quantity)` **KHÔNG có Index FK/status** | **Median**: `316.705 ms`<br>**P95**: `400.924 ms`<br>*(hrtime Median: 318.172 ms)* | — *(Baseline 2a)* | `Limit -> Sort -> Sort Key: -> Sort Method: top-N heapsort  Memory: 27kB -> HashAggregate -> Hash Join -> Seq Scan on order_items oi -> Seq Scan on orders o -> Seq Scan on products p` |
| PostgreSQL 15.17 (Debian 15.17-1.pgdg13+1) (Docker), Node v24.22.1, win32/x64, Warm Cache (shared_buffers=128MB, work_mem=4MB) | products: 30,000<br>orders: 100,000<br>order_items: 199,524 | **Query 2 (b)**: `JOIN products + order_items + orders` + `SUM(oi.quantity)` **CÓ Index FK & status** (so với 2a) | **Median**: `316.705 ms`<br>**P95**: `400.924 ms` | **Median**: `322.802 ms`<br>**P95**: `365.458 ms`<br>*(hrtime Median: 330.001 ms)* | `Limit -> Sort -> Sort Key: -> Sort Method: top-N heapsort  Memory: 27kB -> HashAggregate -> Hash Join -> Seq Scan on order_items oi -> Seq Scan on orders o -> Seq Scan on products p` |
| PostgreSQL 15.17 (Debian 15.17-1.pgdg13+1) (Docker), Node v24.22.1, win32/x64, Warm Cache (shared_buffers=128MB, work_mem=4MB) | products: 30,000<br>orders: 100,000<br>order_items: 199,524 | **Query 2 (c)**: Đọc trực tiếp **denormalized `products.sold_count`** có Composite B-tree Index (so với 2b) | **Median**: `322.802 ms`<br>**P95**: `365.458 ms` | **Median**: `0.032 ms`<br>**P95**: `0.044 ms`<br>*(hrtime Median: 0.716 ms)* | `Limit -> Index Scan using idx_products_bestsellers_active_sort on products` |

---

## 4. Thiết kế Composite B-tree Index cho Query 1 & Giải thích Kỹ thuật

Cho Query 1:
```sql
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
LIMIT 10;
```

Chỉ **một** B-tree index duy nhất được tạo cho Query 1:
```sql
CREATE INDEX idx_products_bestsellers_active_sort
  ON products USING btree (status, sold_count DESC, avg_rating DESC, created_at DESC);
```

### Vì sao chọn thứ tự cột và hướng sắp xếp `(status, sold_count DESC, avg_rating DESC, created_at DESC)`?
1. **Quy tắc Equality Prefix trước, Sort Columns sau**:
   - Cột `status` nằm trong mệnh đề lọc bằng (`WHERE status = 'active'`) nên phải đặt ở **vị trí đầu tiên (leading column)** của B-tree. Nhờ vậy, PostgreSQL định vị ngay phân vùng các lá index chỉ chứa `status = 'active'`.
2. **Thứ tự các cột tiếp theo khớp chính xác mệnh đề `ORDER BY`**:
   - Trong phạm vi các bản ghi có `status = 'active'`, các khóa trong B-tree đã được sắp sẵn lần lượt theo `sold_count DESC`, nếu bằng nhau thì xét tiếp `avg_rating DESC`, và tiếp tục tie-break theo `created_at DESC`.
3. **Tại sao phải chỉ định rõ hướng `DESC` cho cả 3 cột sort?**:
   - PostgreSQL có thể quét ngược một B-tree index (`Index Scan Backward`) nếu tất cả các cột `ORDER BY` đều ngược chiều hoàn toàn với chiều khai báo trong index. Tuy nhiên, việc khai báo tường minh `(status, sold_count DESC, avg_rating DESC, created_at DESC)` giúp khớp trực tiếp chiều quét thuận (`Index Scan`), đồng thời tránh lỗi lệch pha chiều sắp xếp (mixed directions) nếu sau này kết hợp các cột có chiều `ASC`/`DESC` khác nhau.
4. **Hiệu quả với `LIMIT 10` (Early Termination / Avoid Sort)**:
   - Khi không có index này, PostgreSQL phải thực hiện `Seq Scan` quét toàn bộ **30,000** dòng của bảng `products`, lọc `status = 'active'`, rồi đưa vào bộ nhớ để chạy `Sort (top-N heapsort)`.
   - Khi có composite index này, PostgreSQL đọc thẳng **10 tuple hợp lệ đầu tiên** theo thứ tự lá của B-tree và dừng ngay lập tức (`Limit -> Index Scan`), hoàn toàn loại bỏ bước `Sort`.

---

## 5. Chi tiết 10 Lần chạy (Runs #1..#10) và `EXPLAIN (ANALYZE, BUFFERS)`

### 5.1. Query 1 (a) — `products.sold_count` KHÔNG có Index
- File plan: `docs/plans/q1_no_index.txt`
- **Median (Runs #2..#10)**: `9.528 ms` | **P95**: `39.665 ms`

| Run | Trạng thái | EXPLAIN Execution Time (ms) | EXPLAIN Planning Time (ms) | Client hrtime (ms - tham khảo) |
| :---: | :--- | ---: | ---: | ---: |
| #1 | Warm-up (bỏ qua) | 11.433 | 0.129 | 13.206 |
| #2 | Tính vào Median/P95 (Warm Cache) | 9.693 | 0.066 | 11.106 |
| #3 | Tính vào Median/P95 (Warm Cache) | 12.880 | 0.065 | 55.099 |
| #4 | Tính vào Median/P95 (Warm Cache) | 9.049 | 0.061 | 9.968 |
| #5 | Tính vào Median/P95 (Warm Cache) | 8.769 | 0.060 | 9.686 |
| #6 | Tính vào Median/P95 (Warm Cache) | 10.511 | 0.102 | 11.706 |
| #7 | Tính vào Median/P95 (Warm Cache) | 57.522 | 0.058 | 58.470 |
| #8 | Tính vào Median/P95 (Warm Cache) | 8.802 | 0.060 | 9.738 |
| #9 | Tính vào Median/P95 (Warm Cache) | 8.983 | 0.061 | 10.532 |
| #10 | Tính vào Median/P95 (Warm Cache) | 9.528 | 0.098 | 10.831 |

```text
Limit  (cost=4271.78..4271.81 rows=10 width=88) (actual time=9.673..9.676 rows=10 loops=1)
  Buffers: shared hit=3411
  ->  Sort  (cost=4271.78..4327.98 rows=22480 width=88) (actual time=9.672..9.673 rows=10 loops=1)
        Sort Key: sold_count DESC, avg_rating DESC, created_at DESC
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=3411
        ->  Seq Scan on products  (cost=0.00..3786.00 rows=22480 width=88) (actual time=0.507..6.224 rows=22480 loops=1)
              Filter: (status = 'active'::enum_products_status)
              Rows Removed by Filter: 7520
              Buffers: shared hit=3411
Planning Time: 0.066 ms
Execution Time: 9.693 ms
```

### 5.2. Query 1 (b) — `products.sold_count` CÓ Composite B-tree Index
- File plan: `docs/plans/q1_with_index.txt`
- **Median (Runs #2..#10)**: `0.038 ms` | **P95**: `0.040 ms`

| Run | Trạng thái | EXPLAIN Execution Time (ms) | EXPLAIN Planning Time (ms) | Client hrtime (ms - tham khảo) |
| :---: | :--- | ---: | ---: | ---: |
| #1 | Warm-up (bỏ qua) | 0.085 | 0.292 | 1.389 |
| #2 | Tính vào Median/P95 (Warm Cache) | 0.034 | 0.064 | 0.765 |
| #3 | Tính vào Median/P95 (Warm Cache) | 0.031 | 0.054 | 0.678 |
| #4 | Tính vào Median/P95 (Warm Cache) | 0.034 | 0.057 | 1.695 |
| #5 | Tính vào Median/P95 (Warm Cache) | 0.039 | 0.069 | 0.951 |
| #6 | Tính vào Median/P95 (Warm Cache) | 0.038 | 0.088 | 1.192 |
| #7 | Tính vào Median/P95 (Warm Cache) | 0.038 | 0.070 | 0.975 |
| #8 | Tính vào Median/P95 (Warm Cache) | 0.040 | 0.072 | 0.966 |
| #9 | Tính vào Median/P95 (Warm Cache) | 0.039 | 0.070 | 0.908 |
| #10 | Tính vào Median/P95 (Warm Cache) | 0.036 | 0.066 | 0.934 |

```text
Limit  (cost=0.29..5.75 rows=10 width=88) (actual time=0.013..0.024 rows=10 loops=1)
  Buffers: shared hit=12
  ->  Index Scan using idx_products_bestsellers_active_sort on products  (cost=0.29..12275.32 rows=22480 width=88) (actual time=0.012..0.023 rows=10 loops=1)
        Index Cond: (status = 'active'::enum_products_status)
        Buffers: shared hit=12
Planning Time: 0.064 ms
Execution Time: 0.034 ms
```

### 5.3. Query 2 (a) — `JOIN + SUM(oi.quantity)` KHÔNG có Index FK/status
- File plan: `docs/plans/q2a_join_sum_no_fk_index.txt`
- **Median (Runs #2..#10)**: `316.705 ms` | **P95**: `400.924 ms`

| Run | Trạng thái | EXPLAIN Execution Time (ms) | EXPLAIN Planning Time (ms) | Client hrtime (ms - tham khảo) |
| :---: | :--- | ---: | ---: | ---: |
| #1 | Warm-up (bỏ qua) | 290.515 | 0.328 | 292.100 |
| #2 | Tính vào Median/P95 (Warm Cache) | 311.028 | 0.259 | 312.487 |
| #3 | Tính vào Median/P95 (Warm Cache) | 292.248 | 0.253 | 293.904 |
| #4 | Tính vào Median/P95 (Warm Cache) | 287.366 | 0.254 | 288.913 |
| #5 | Tính vào Median/P95 (Warm Cache) | 316.705 | 0.263 | 318.172 |
| #6 | Tính vào Median/P95 (Warm Cache) | 361.316 | 0.272 | 363.410 |
| #7 | Tính vào Median/P95 (Warm Cache) | 312.022 | 0.431 | 314.181 |
| #8 | Tính vào Median/P95 (Warm Cache) | 382.585 | 0.303 | 384.427 |
| #9 | Tính vào Median/P95 (Warm Cache) | 406.869 | 0.302 | 408.843 |
| #10 | Tính vào Median/P95 (Warm Cache) | 392.006 | 0.243 | 393.641 |

```text
Limit  (cost=18167.74..18167.76 rows=10 width=88) (actual time=310.895..310.902 rows=10 loops=1)
  Buffers: shared hit=11331
  ->  Sort  (cost=18167.74..18223.94 rows=22480 width=88) (actual time=310.893..310.899 rows=10 loops=1)
        Sort Key: ((sum(oi.quantity))::integer) DESC, p.avg_rating DESC, p.created_at DESC
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=11331
        ->  HashAggregate  (cost=17400.95..17681.95 rows=22480 width=88) (actual time=305.835..308.646 rows=16383 loops=1)
              Group Key: p.id
              Batches: 1  Memory Usage: 3857kB
              Buffers: shared hit=11331
              ->  Hash Join  (cost=9979.50..16913.25 rows=97540 width=88) (actual time=76.984..272.468 rows=96532 loops=1)
                    Hash Cond: (oi.product_id = p.id)
                    Buffers: shared hit=11331
                    ->  Hash Join  (cost=5912.50..12504.51 rows=130169 width=20) (actual time=66.239..222.520 rows=129860 loops=1)
                          Hash Cond: (oi.order_id = o.id)
                          Buffers: shared hit=7920
                          ->  Seq Scan on order_items oi  (cost=0.00..6068.24 rows=199524 width=36) (actual time=0.007..60.587 rows=199524 loops=1)
                                Buffers: shared hit=4073
                          ->  Hash  (cost=5097.00..5097.00 rows=65240 width=16) (actual time=66.190..66.191 rows=65098 loops=1)
                                Buckets: 65536  Batches: 1  Memory Usage: 3564kB
                                Buffers: shared hit=3847
                                ->  Seq Scan on orders o  (cost=0.00..5097.00 rows=65240 width=16) (actual time=0.004..58.376 rows=65098 loops=1)
                                      Filter: (status = 'delivered'::enum_orders_status)
                                      Rows Removed by Filter: 34902
                                      Buffers: shared hit=3847
                    ->  Hash  (cost=3786.00..3786.00 rows=22480 width=84) (actual time=10.724..10.725 rows=22480 loops=1)
                          Buckets: 32768  Batches: 1  Memory Usage: 2891kB
                          Buffers: shared hit=3411
                          ->  Seq Scan on products p  (cost=0.00..3786.00 rows=22480 width=84) (actual time=0.426..6.538 rows=22480 loops=1)
                                Filter: (status = 'active'::enum_products_status)
                                Rows Removed by Filter: 7520
                                Buffers: shared hit=3411
Planning:
  Buffers: shared hit=22
Planning Time: 0.259 ms
Execution Time: 311.028 ms
```

### 5.4. Query 2 (b) — `JOIN + SUM(oi.quantity)` CÓ Index FK & status
- File plan: `docs/plans/q2b_join_sum_with_fk_index.txt`
- **Median (Runs #2..#10)**: `322.802 ms` | **P95**: `365.458 ms`

| Run | Trạng thái | EXPLAIN Execution Time (ms) | EXPLAIN Planning Time (ms) | Client hrtime (ms - tham khảo) |
| :---: | :--- | ---: | ---: | ---: |
| #1 | Warm-up (bỏ qua) | 305.547 | 2.143 | 308.971 |
| #2 | Tính vào Median/P95 (Warm Cache) | 360.223 | 0.403 | 361.896 |
| #3 | Tính vào Median/P95 (Warm Cache) | 324.151 | 0.478 | 326.018 |
| #4 | Tính vào Median/P95 (Warm Cache) | 301.615 | 0.314 | 303.245 |
| #5 | Tính vào Median/P95 (Warm Cache) | 313.962 | 0.573 | 368.700 |
| #6 | Tính vào Median/P95 (Warm Cache) | 315.450 | 0.447 | 316.952 |
| #7 | Tính vào Median/P95 (Warm Cache) | 328.282 | 0.649 | 330.001 |
| #8 | Tính vào Median/P95 (Warm Cache) | 317.799 | 0.314 | 371.710 |
| #9 | Tính vào Median/P95 (Warm Cache) | 322.802 | 0.441 | 324.972 |
| #10 | Tính vào Median/P95 (Warm Cache) | 368.948 | 0.513 | 370.767 |

```text
Limit  (cost=18164.03..18164.06 rows=10 width=88) (actual time=360.045..360.053 rows=10 loops=1)
  Buffers: shared hit=11331
  ->  Sort  (cost=18164.03..18220.23 rows=22480 width=88) (actual time=360.043..360.049 rows=10 loops=1)
        Sort Key: ((sum(oi.quantity))::integer) DESC, p.avg_rating DESC, p.created_at DESC
        Sort Method: top-N heapsort  Memory: 27kB
        Buffers: shared hit=11331
        ->  HashAggregate  (cost=17397.25..17678.25 rows=22480 width=88) (actual time=305.168..357.172 rows=16383 loops=1)
              Group Key: p.id
              Batches: 1  Memory Usage: 3857kB
              Buffers: shared hit=11331
              ->  Hash Join  (cost=9977.66..16910.64 rows=97321 width=88) (actual time=75.524..274.227 rows=96532 loops=1)
                    Hash Cond: (oi.product_id = p.id)
                    Buffers: shared hit=11331
                    ->  Hash Join  (cost=5910.66..12502.68 rows=129876 width=20) (actual time=16.557..177.663 rows=129860 loops=1)
                          Hash Cond: (oi.order_id = o.id)
                          Buffers: shared hit=7920
                          ->  Seq Scan on order_items oi  (cost=0.00..6068.24 rows=199524 width=36) (actual time=0.009..12.211 rows=199524 loops=1)
                                Buffers: shared hit=4073
                          ->  Hash  (cost=5097.00..5097.00 rows=65093 width=16) (actual time=16.438..16.439 rows=65098 loops=1)
                                Buckets: 65536  Batches: 1  Memory Usage: 3564kB
                                Buffers: shared hit=3847
                                ->  Seq Scan on orders o  (cost=0.00..5097.00 rows=65093 width=16) (actual time=0.013..8.835 rows=65098 loops=1)
                                      Filter: (status = 'delivered'::enum_orders_status)
                                      Rows Removed by Filter: 34902
                                      Buffers: shared hit=3847
                    ->  Hash  (cost=3786.00..3786.00 rows=22480 width=84) (actual time=58.941..58.942 rows=22480 loops=1)
                          Buckets: 32768  Batches: 1  Memory Usage: 2891kB
                          Buffers: shared hit=3411
                          ->  Seq Scan on products p  (cost=0.00..3786.00 rows=22480 width=84) (actual time=0.540..55.149 rows=22480 loops=1)
                                Filter: (status = 'active'::enum_products_status)
                                Rows Removed by Filter: 7520
                                Buffers: shared hit=3411
Planning:
  Buffers: shared hit=46
Planning Time: 0.403 ms
Execution Time: 360.223 ms
```

### 5.5. Query 2 (c) — Đọc trực tiếp `products.sold_count` CÓ Composite B-tree Index
- File plan: `docs/plans/q2c_denormalized_sold_count.txt`
- **Median (Runs #2..#10)**: `0.032 ms` | **P95**: `0.044 ms`

| Run | Trạng thái | EXPLAIN Execution Time (ms) | EXPLAIN Planning Time (ms) | Client hrtime (ms - tham khảo) |
| :---: | :--- | ---: | ---: | ---: |
| #1 | Warm-up (bỏ qua) | 0.239 | 0.188 | 1.454 |
| #2 | Tính vào Median/P95 (Warm Cache) | 0.033 | 0.063 | 0.926 |
| #3 | Tính vào Median/P95 (Warm Cache) | 0.048 | 0.132 | 0.977 |
| #4 | Tính vào Median/P95 (Warm Cache) | 0.033 | 0.052 | 0.695 |
| #5 | Tính vào Median/P95 (Warm Cache) | 0.028 | 0.044 | 0.602 |
| #6 | Tính vào Median/P95 (Warm Cache) | 0.025 | 0.044 | 0.594 |
| #7 | Tính vào Median/P95 (Warm Cache) | 0.025 | 0.041 | 0.625 |
| #8 | Tính vào Median/P95 (Warm Cache) | 0.038 | 0.071 | 1.159 |
| #9 | Tính vào Median/P95 (Warm Cache) | 0.032 | 0.059 | 0.955 |
| #10 | Tính vào Median/P95 (Warm Cache) | 0.028 | 0.046 | 0.716 |

```text
Limit  (cost=0.29..5.75 rows=10 width=88) (actual time=0.013..0.024 rows=10 loops=1)
  Buffers: shared hit=12
  ->  Index Scan using idx_products_bestsellers_active_sort on products  (cost=0.29..12275.32 rows=22480 width=88) (actual time=0.012..0.023 rows=10 loops=1)
        Index Cond: (status = 'active'::enum_products_status)
        Buffers: shared hit=12
Planning Time: 0.063 ms
Execution Time: 0.033 ms
```

---

## 6. Hướng dẫn Lệnh chạy Từng bước để Tái lập (Reproducible Commands)

```bash
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
```
