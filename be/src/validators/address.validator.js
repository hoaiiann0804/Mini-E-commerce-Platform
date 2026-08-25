const Joi = require("joi");

// Create/Update address validation schema
const addressSchema = Joi.object({
  name: Joi.string().allow("").optional(),
  firstName: Joi.string().required().messages({
    "string.empty": "Tên không được để trống",
    "any.required": "Tên là trường bắt buộc",
  }),
  lastName: Joi.string().required().messages({
    "string.empty": "Họ không được để trống",
    "any.required": "Họ là trường bắt buộc",
  }),
  company: Joi.string().allow("").optional(),
  address1: Joi.string().required().messages({
    "string.empty": "Địa chỉ không được để trống",
    "any.required": "Địa chỉ là trường bắt buộc",
  }),
  address2: Joi.string().allow("").optional(),
  province: Joi.string().required().messages({
    "string.empty": "Tỉnh/Thành phố ko được để trống ",
    "any.required": "Tỉnh/Thành phố là trường bắt buộc",
  }),
  ward: Joi.string().required().messages({
    "string.empty": "Xã/Phường không được để trống ",
    "any.required": "Xã/Phường là trường bắt buộc",
  }),
  provinceCode: Joi.string().allow("").optional(),
  wardCode: Joi.string().allow("").optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  zip: Joi.string().required().messages({
    "string.empty": "Mã bưu điện không được để trống",
    "any.required": "Mã bưu điện là trường bắt buộc",
  }),
  country: Joi.string().required().messages({
    "string.empty": "Quốc gia không được để trống",
    "any.required": "Quốc gia là trường bắt buộc",
  }),
  phone: Joi.string().allow("").optional(),
  isDefault: Joi.boolean().default(false),
});

module.exports = {
  addressSchema,
};
