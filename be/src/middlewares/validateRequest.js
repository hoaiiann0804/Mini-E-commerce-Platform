const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Middleware to validate request body against a Joi schema
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

/**
 * Middleware để kiểm tra validation errors từ express-validator
 */
const validateExpressValidator = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    // Log chi tiết để debug
    //console.log(
      '🔍 Validation Errors:',
      JSON.stringify(formattedErrors, null, 2)
    );
    //console.log('📝 Request Body:', JSON.stringify(req.body, null, 2));
    //console.log('🔗 Request Params:', JSON.stringify(req.params, null, 2));

    return res.status(400).json({
      status: 'fail',
      message: 'Validation error',
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Factory function để tạo validate middleware với express-validator rules
 */
const validate = (validationRules) => {
  return [...validationRules, validateExpressValidator];
};

module.exports = {
  validateRequest,
  validate,
  validateExpressValidator,
};
