// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Development error handler - sends detailed error info
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// Production error handler - sends limited error info
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    });
  }
};

// Handle invalid UUID / data format in PostgreSQL (SQLSTATE 22P02)
const handleInvalidInputSyntaxDB = () =>
  new AppError('Định dạng dữ liệu hoặc ID không hợp lệ.', 400);

// Handle Sequelize validation error
const handleSequelizeValidationError = (err) => {
  const errors = (err.errors || []).map((el) => el.message);
  const message = `Dữ liệu không hợp lệ. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401);

const handleJWTExpiredError = () =>
  new AppError('Token đã hết hạn. Vui lòng đăng nhập lại!', 401);

// Handle Sequelize unique constraint error
const handleSequelizeUniqueConstraintError = (err) => {
  // Extract field name and value from the error
  const field = err.errors[0]?.path;
  const value = err.errors[0]?.value;
  const message = `Giá trị '${value}' đã tồn tại cho trường '${field}'. Vui lòng sử dụng giá trị khác!`;

  return new AppError(message, 400);
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.name = err.name;
    error.message = err.message;

    if (err.parent?.code === '22P02') error = handleInvalidInputSyntaxDB();
    if (error.name === 'SequelizeValidationError')
      error = handleSequelizeValidationError(err);
    if (error.name === 'SequelizeUniqueConstraintError')
      error = handleSequelizeUniqueConstraintError(err);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = {
  AppError,
  errorHandler,
};
