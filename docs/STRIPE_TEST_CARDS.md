# Stripe Test Cards Guide

## 🧪 Test Cards for Development

Stripe cung cấp các thẻ test để kiểm tra payment flow trong môi trường development. **Chỉ sử dụng trong test mode!**

## 💳 Basic Test Cards

### ✅ Successful Payments

| Card Number           | Brand                 | Description                      |
| --------------------- | --------------------- | -------------------------------- |
| `4242 4242 4242 4242` | Visa                  | Thẻ test cơ bản, luôn thành công |
| `4000 0566 5566 5556` | Visa (debit)          | Thẻ debit test                   |
| `5555 5555 5555 4444` | Mastercard            | Thẻ Mastercard test              |
| `2223 0031 2200 3222` | Mastercard (2-series) | Thẻ Mastercard mới               |
| `5200 8282 8282 8210` | Mastercard (debit)    | Thẻ Mastercard debit             |
| `5105 1051 0510 5100` | Mastercard (prepaid)  | Thẻ Mastercard prepaid           |
| `3782 822463 10005`   | American Express      | Thẻ Amex test                    |
| `3714 496353 98431`   | American Express      | Thẻ Amex test khác               |

### ❌ Declined Cards

| Card Number           | Error Type         | Description          |
| --------------------- | ------------------ | -------------------- |
| `4000 0000 0000 0002` | Generic decline    | Thẻ bị từ chối chung |
| `4000 0000 0000 9995` | Insufficient funds | Không đủ tiền        |
| `4000 0000 0000 9987` | Lost card          | Thẻ bị mất           |
| `4000 0000 0000 9979` | Stolen card        | Thẻ bị đánh cắp      |
| `4000 0000 0000 0069` | Expired card       | Thẻ hết hạn          |
| `4000 0000 0000 0127` | Incorrect CVC      | CVC sai              |
| `4000 0000 0000 0119` | Processing error   | Lỗi xử lý            |

## 🔐 3D Secure Test Cards

### Authentication Required

| Card Number           | Description                         |
| --------------------- | ----------------------------------- |
| `4000 0027 6000 3184` | 3D Secure authentication required   |
| `4000 0082 6000 3178` | 3D Secure 2 authentication required |

### Authentication Optional

| Card Number           | Description          |
| --------------------- | -------------------- |
| `4000 0025 0000 3155` | 3D Secure optional   |
| `4000 0000 0000 3220` | 3D Secure 2 optional |

## 🌍 International Test Cards

### Specific Countries

| Card Number           | Country | Description    |
| --------------------- | ------- | -------------- |
| `4000 0036 0000 0014` | Brazil  | Brazilian card |
| `4000 0076 0000 0016` | Mexico  | Mexican card   |
| `4000 0015 6000 0021` | India   | Indian card    |
| `4000 0044 0000 0004` | UK      | UK card        |
| `4000 0025 0000 0003` | France  | French card    |

## 💰 Currency-Specific Cards

### Zero-decimal currencies (VND, JPY, KRW)

| Card Number           | Currency | Description     |
| --------------------- | -------- | --------------- |
| `4000 0070 4000 0007` | VND      | Vietnamese Dong |
| `4000 0039 2000 0003` | JPY      | Japanese Yen    |
| `4000 0041 0000 0004` | KRW      | Korean Won      |

## 📝 Test Data to Use

### Valid Test Information

```
Card Number: 4242 4242 4242 4242
Expiry Date: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP Code: Any 5 digits (e.g., 12345)
Name: Any name
```

### Invalid Test Information

```
Expiry Date: Any past date (e.g., 12/20)
CVC: 000 (for CVC failure)
```

## 🚨 Important Notes

### ⚠️ Security Warnings

- **NEVER** use real card numbers in test mode
- **NEVER** use test cards in production
- Test cards only work in Stripe test mode

### 🔧 Development Tips

1. **Always use test mode** during development
2. **Check webhook events** for payment confirmations
3. **Test different scenarios** (success, failure, 3D Secure)
4. **Verify error handling** with declined cards

### 🌐 Webhook Testing

```bash
# Install Stripe CLI for webhook testing
stripe listen --forward-to localhost:8888/api/payment/webhook

# Test webhook events
stripe trigger payment_intent.succeeded
```

## 📚 Common Test Scenarios

### 1. Successful Payment Flow

```
1. Use: 4242 4242 4242 4242
2. Enter valid expiry and CVC
3. Submit payment
4. Verify order status updates to 'paid'
```

### 2. Declined Payment Flow

```
1. Use: 4000 0000 0000 0002
2. Enter valid expiry and CVC
3. Submit payment
4. Verify error handling
5. Verify order status remains 'pending'
```

### 3. 3D Secure Flow

```
1. Use: 4000 0027 6000 3184
2. Enter valid expiry and CVC
3. Submit payment
4. Complete 3D Secure authentication
5. Verify payment success
```

## 🔗 Useful Links

- [Stripe Test Cards Documentation](https://stripe.com/docs/testing#cards)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Testing Guide](https://stripe.com/docs/webhooks/test)
- [3D Secure Testing](https://stripe.com/docs/testing#regulatory-cards)

---

**💡 Pro Tip**: Luôn test cả success và failure scenarios để đảm bảo ứng dụng xử lý tất cả các trường hợp!
