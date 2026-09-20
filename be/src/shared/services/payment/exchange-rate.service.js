const { AppError } = require("../../../middlewares/errorHandler");

let cached;
let pending;
const TTL = 60 * 60 * 1000;

async function getUsdVndRate() {
  if (cached && cached.expiresAt > Date.now()) return cached.quote;
  // Gộp request đồng thời: nhiều khách checkout không cần gọi nhà cung cấp cùng lúc.
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Exchange rate HTTP error");
      const data = await response.json();
      const rate = data.rates?.VND;
      const updatedAt = data.time_last_update_unix * 1000;
      if (data.result !== "success" || data.base_code !== "USD" ||
          !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(updatedAt) ||
          updatedAt > Date.now() + 300000 || Date.now() - updatedAt > 48 * TTL) {
        throw new Error("Invalid or stale exchange rate");
      }
      const quote = { rate, updatedAt: new Date(updatedAt).toISOString(), source: "ExchangeRate-API" };
      cached = { quote, expiresAt: Math.min(Date.now() + TTL, updatedAt + 48 * TTL) };
      return quote;
    } catch {
      // Không tự thay bằng tỷ giá gắn cứng hoặc cache hết hạn: khách có thể bị thu sai tiền.
      throw new AppError("Không lấy được tỷ giá thanh toán. Vui lòng thử lại sau.", 503);
    }
  })();
  try { return await pending; } finally { pending = null; }
}

async function createQuote(total) {
  const totalVnd = Number(total);
  if (!Number.isFinite(totalVnd) || totalVnd <= 0) throw new AppError("Invalid order total", 400);
  const fx = await getUsdVndRate();
  const amountInCents = Math.round(totalVnd / fx.rate * 100);
  if (!Number.isSafeInteger(amountInCents) || amountInCents < 50 || amountInCents > 99999999) {
    throw new AppError("Order amount is outside Stripe USD limits", 400);
  }
  return { ...fx, totalVnd, amountInCents, currency: "usd" };
}

module.exports = { getUsdVndRate, createQuote };
