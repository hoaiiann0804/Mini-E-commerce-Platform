# Docker + Stripe Troubleshooting (E‑commerce Mini)

Tài liệu này tổng hợp toàn bộ lỗi và cách fix đã gặp trong quá trình setup Docker + Stripe + DB.

## 1) Lỗi mất dữ liệu sau khi đổi layout
**Triệu chứng**
- Dữ liệu DB biến mất sau khi chuyển `docker-compose` vào thư mục mới.

**Nguyên nhân**
- Docker tạo **volume mới** do project name thay đổi khi compose đổi vị trí.

**Cách fix**
- Cố định volume name và project name.
- Ví dụ:

```yaml
volumes:
  pgdata_ecommerce:
    name: e-commrcemini_pgdata_ecommerce
```

- Thêm `COMPOSE_PROJECT_NAME` vào env:
```
COMPOSE_PROJECT_NAME=e-commrcemini
```

- Thêm `-p e-commrcemini` vào scripts.

## 2) Container name conflict
**Triệu chứng**
- `Conflict. The container name ... is already in use`

**Cách fix**
```bash
docker rm -f e-commerce-web e-commerce-postgres
```

## 3) Stripe lỗi kết nối (EAI_AGAIN api.stripe.com)
**Triệu chứng**
- `StripeConnectionError: getaddrinfo EAI_AGAIN api.stripe.com`

**Nguyên nhân**
- DNS trong Docker bị lỗi/timeout.
- `dns.lookup` (getaddrinfo) fail trong container.

**Các bước xử lý đã làm**
1. Test DNS trong container:
```bash
docker exec -it e-commerce-web node -e "require('dns').lookup('api.stripe.com',console.log)"
```

2. Xác nhận HTTPS thông:
```bash
docker exec -it e-commerce-web node -e "require('https').get('https://api.stripe.com',r=>console.log('status',r.statusCode)).on('error',console.error)"
```

3. Fix DNS Windows host
- Đổi DNS IPv4 về `8.8.8.8` và `1.1.1.1`
- Nếu cần, tắt IPv6 trên adapter Docker/WSL.

4. Fix DNS Docker Desktop Engine
- Settings → Docker Engine → thêm:
```json
{
  "dns": ["8.8.8.8", "1.1.1.1"]
}
```

5. Adapter đúng của WSL:
- `vEthernet (WSL (Hyper-V firewall))`

```powershell
Set-DnsClientServerAddress -InterfaceAlias "vEthernet (WSL (Hyper-V firewall))" -ServerAddresses 8.8.8.8,1.1.1.1
Disable-NetAdapterBinding -Name "vEthernet (WSL (Hyper-V firewall))" -ComponentID ms_tcpip6
ipconfig /flushdns
```

## 4) Stripe vẫn lỗi do dns.lookup trong Node
**Triệu chứng**
- `ERR_INVALID_IP_ADDRESS: undefined` trong Stripe log.

**Nguyên nhân**
- Custom `dns.lookup` chưa hỗ trợ `options.all`.

**Fix cuối cùng (thành công)**
- Ép Stripe dùng `dns.resolve4` và hỗ trợ `options.all`.
- File: `be/src/services/payment/stripeService.js`

**Bước build lại**
```bash
npm run docker:down
docker compose --env-file ops/env/.env.dev -p e-commrcemini -f ops/docker/docker-compose.dev.yml build --no-cache api
npm run docker:up
```

## 5) Container API tự restart
**Triệu chứng**
- `Invalid IP address: undefined` khi connect DB

**Nguyên nhân**
- Patch DNS toàn app làm DB host bị sai

**Fix**
- Chỉ patch DNS trong Stripe service, không patch toàn app.

## 6) Lệnh Docker chuẩn (layout mới)
```bash
npm run docker:up
npm run docker:down
npm run docker:logs:api
```

**Chạy compose trực tiếp**
```bash
docker compose --env-file ops/env/.env.dev -p e-commrcemini -f ops/docker/docker-compose.dev.yml up -d
```

## 7) Ghi chú an toàn
- Không dùng `docker compose down -v` nếu muốn giữ dữ liệu.
- Dữ liệu DB nằm ở volume `e-commrcemini_pgdata_ecommerce`.

---

Nếu cần bổ sung thêm lỗi khác, chỉ cần ghi vào file này để tiện tra cứu.



npm run docker:down
docker compose --env-file ops/env/.env.dev -p e-commrcemini -f ops/docker/docker-compose.dev.yml build --no-cache api
npm run docker:up
