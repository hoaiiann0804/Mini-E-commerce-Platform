jest.mock("../src/shared/services/payment/stripe.service", () => ({
  createPaymentIntent: jest.fn(), confirmPaymentIntent: jest.fn(),
}));
jest.mock("../src/models", () => ({
  Order: { findOne: jest.fn() }, OrderItem: {}, User: {},
  sequelize: { transaction: jest.fn((fn) => fn({ LOCK: { UPDATE: "UPDATE" } })) },
}));
jest.mock("../src/shared/services/email/emailService", () => ({}));

const originalFetch = global.fetch;
const stripe = require("../src/shared/services/payment/stripe.service");
const { Order } = require("../src/models");
const { createPaymentIntent } = require("../src/controllers/payment.controller");

beforeEach(() => jest.clearAllMocks());
afterAll(() => { global.fetch = originalFetch; });

test("server total determines cents; a repeated request reuses the locked intent", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
    result: "success", base_code: "USD", rates: { VND: 26019 },
    time_last_update_unix: Math.floor(Date.now() / 1000),
  }) });
  const order = { id: "order-1", total: "30999300.00", paymentMethod: "stripe",
    status: "pending", paymentStatus: "pending", update: jest.fn(async (values) => Object.assign(order, values)) };
  Order.findOne.mockResolvedValue(order);
  const intent = { id: "pi_test", amount: 119141, currency: "usd", client_secret: "test",
    metadata: { orderId: order.id }, status: "requires_payment_method" };
  stripe.createPaymentIntent.mockResolvedValue(intent);
  stripe.confirmPaymentIntent.mockResolvedValue(intent);
  const req = { user: { id: "user-1" }, body: { orderId: order.id, amount: 1, currency: "vnd" } };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }, next = jest.fn();
  await createPaymentIntent(req, res, next);
  await createPaymentIntent(req, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(stripe.createPaymentIntent).toHaveBeenCalledTimes(1);
  expect(stripe.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({
    amountInCents: Math.round(30999300 / 26019 * 100), currency: "usd",
  }));
  expect(Order.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: order.id, userId: "user-1" } }));
  expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: 1191.41 }) }));
});

test.each([null, { status: "expired" }, { status: "pending", paymentMethod: "stripe", paymentStatus: "paid" }])(
  "rejects missing or unpayable orders", async (order) => {
    Order.findOne.mockResolvedValue(order);
    const next = jest.fn();
    await createPaymentIntent({ user: { id: "user" }, body: { orderId: "id" } }, {}, next);
    expect(next).toHaveBeenCalled();
    expect(stripe.createPaymentIntent).not.toHaveBeenCalled();
  });

test("invalid provider data and network errors do not fall back to hardcoded rates", async () => {
  jest.resetModules();
  const fx = require("../src/shared/services/payment/exchange-rate.service");
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ result: "success", rates: { VND: 0 } }) });
  await expect(fx.createQuote(30999300)).rejects.toMatchObject({ statusCode: 503 });
  global.fetch.mockRejectedValue(new Error("offline"));
  await expect(fx.createQuote(30999300)).rejects.toMatchObject({ statusCode: 503 });
});
