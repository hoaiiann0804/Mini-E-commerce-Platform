const Joi = require('joi');

// Create order validation schema
const createOrderSchema = Joi.object({
  shippingFirstName: Joi.string().required().messages({
    'string.empty': 'Tên người nhận không được để trống',
    'any.required': 'Tên người nhận là trường bắt buộc',
  }),
  shippingLastName: Joi.string().required().messages({
    'string.empty': 'Họ người nhận không được để trống',
    'any.required': 'Họ người nhận là trường bắt buộc',
  }),
  shippingCompany: Joi.string().allow('').optional(),
  shippingAddress1: Joi.string().required().messages({
    'string.empty': 'Địa chỉ giao hàng không được để trống',
    'any.required': 'Địa chỉ giao hàng là trường bắt buộc',
  }),
  shippingAddress2: Joi.string().allow('').optional(),
  shippingCity: Joi.string().required().messages({
    'string.empty': 'Thành phố giao hàng không được để trống',
    'any.required': 'Thành phố giao hàng là trường bắt buộc',
  }),
  shippingState: Joi.string().required().messages({
    'string.empty': 'Tỉnh/Thành phố giao hàng không được để trống',
    'any.required': 'Tỉnh/Thành phố giao hàng là trường bắt buộc',
  }),
  shippingZip: Joi.string().required().messages({
    'string.empty': 'Mã bưu điện giao hàng không được để trống',
    'any.required': 'Mã bưu điện giao hàng là trường bắt buộc',
  }),
  shippingCountry: Joi.string().required().messages({
    'string.empty': 'Quốc gia giao hàng không được để trống',
    'any.required': 'Quốc gia giao hàng là trường bắt buộc',
  }),
  shippingPhone: Joi.string().allow('').optional(),

  billingFirstName: Joi.string().required().messages({
    'string.empty': 'Tên người thanh toán không được để trống',
    'any.required': 'Tên người thanh toán là trường bắt buộc',
  }),
  billingLastName: Joi.string().required().messages({
    'string.empty': 'Họ người thanh toán không được để trống',
    'any.required': 'Họ người thanh toán là trường bắt buộc',
  }),
  billingCompany: Joi.string().allow('').optional(),
  billingAddress1: Joi.string().required().messages({
    'string.empty': 'Địa chỉ thanh toán không được để trống',
    'any.required': 'Địa chỉ thanh toán là trường bắt buộc',
  }),
  billingAddress2: Joi.string().allow('').optional(),
  billingCity: Joi.string().required().messages({
    'string.empty': 'Thành phố thanh toán không được để trống',
    'any.required': 'Thành phố thanh toán là trường bắt buộc',
  }),
  billingState: Joi.string().required().messages({
    'string.empty': 'Tỉnh/Thành phố thanh toán không được để trống',
    'any.required': 'Tỉnh/Thành phố thanh toán là trường bắt buộc',
  }),
  billingZip: Joi.string().required().messages({
    'string.empty': 'Mã bưu điện thanh toán không được để trống',
    'any.required': 'Mã bưu điện thanh toán là trường bắt buộc',
  }),
  billingCountry: Joi.string().required().messages({
    'string.empty': 'Quốc gia thanh toán không được để trống',
    'any.required': 'Quốc gia thanh toán là trường bắt buộc',
  }),
  billingPhone: Joi.string().allow('').optional(),

  paymentMethod: Joi.string().required().messages({
    'string.empty': 'Phương thức thanh toán không được để trống',
    'any.required': 'Phương thức thanh toán là trường bắt buộc',
  }),
  notes: Joi.string().allow('').optional(),
  couponCode: Joi.string().max(50).allow('').optional().messages({
    'string.max': 'Mã giảm giá không được vượt quá 50 ký tự',
  }),
});

// Update order status validation schema
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .required()
    .messages({
      'any.only': 'Trạng thái đơn hàng không hợp lệ',
      'any.required': 'Trạng thái đơn hàng là trường bắt buộc',
    }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
