# khởi động đúng với file env.dev để compose thực hiện interpolation
docker compose --env-file ops/env/.env.dev -f ops/docker/docker-compose.dev.yml up --build

# kiểm tra trạng thái và health của các container
docker compose -f ops/docker/docker-compose.dev.yml ps
docker inspect --format '{{.State.Health.Status}}' e-commerce-postgres || true

# xem logs để biết lý do DB không ready
docker compose -f ops/docker/docker-compose.dev.yml logs db --tail=200
docker compose -f ops/docker/docker-compose.dev.yml logs api --tail=200

# kiểm tra giá trị DATABASE_URL bên trong container api (nếu container chạy)
docker compose -f ops/docker/docker-compose.dev.yml exec api sh -c 'echo $DATABASE_URL; env | grep DB_ || true'

# nếu api crash nhanh, inspect env của container đã tạo
docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' e-commerce-web | grep DATABASE_URL || true

# monitoring stack
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3001  (admin / admin)
# - cAdvisor: http://localhost:8081
# - PostgreSQL exporter: http://localhost:9187/metrics
#
# Grafana datasource Prometheus is provisioned automatically.
# If you want API-level latency and route bottlenecks, the next step is adding /metrics to the backend.
