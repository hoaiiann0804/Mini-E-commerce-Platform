const Joi = require("joi");
const { AppError } = require("../middlewares/errorHandler");

const uuid = Joi.string().guid({ version: ["uuidv4", "uuidv5"] });
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).allow("").default(""),
  lowStock: Joi.boolean().default(false),
  productId: uuid, variantId: uuid,
  type: Joi.string().valid("OPENING","IN","OUT","RETURN","RELEASE","ADJUSTMENT"),
  from: Joi.date().iso(), to: Joi.date().iso().min(Joi.ref("from")),
});
const movementSchema = Joi.object({
  productId: uuid.required(), variantId: uuid.allow(null),
  type: Joi.string().valid("IN", "ADJUSTMENT", "RETURN").required(),
  quantityChange: Joi.number().integer().min(-2147483647).max(2147483647).invalid(0).required(),
  reason: Joi.string().trim().min(3).max(1000).required(),
  unitCost: Joi.number().min(0).max(999999999999.99).precision(2),
  orderItemId: uuid,
  requestKey: Joi.string().pattern(/^[a-zA-Z0-9:_-]{8,120}$/).required(),
}).custom((value, helpers) => {
  if (value.type !== "ADJUSTMENT" && value.quantityChange < 1) return helpers.error("any.invalid");
  if (value.type === "IN" && value.unitCost === undefined) return helpers.error("any.invalid");
  if (value.type === "RETURN" && !value.orderItemId) return helpers.error("any.invalid");
  if (value.type !== "RETURN" && value.orderItemId) return helpers.error("any.invalid");
  if (value.type !== "IN" && value.unitCost !== undefined) return helpers.error("any.invalid");
  return value;
});
function validate(schema, data) {
  const result = schema.validate(data);
  if (result.error) throw new AppError(result.error.message, 400);
  return result.value;
}

const validateInventoryQuery = (query) => validate(querySchema, query);
const validateInventoryMovement = (body) => validate(movementSchema, body);

module.exports = {
  querySchema,
  movementSchema,
  validateInventoryQuery,
  validateInventoryMovement,
};
