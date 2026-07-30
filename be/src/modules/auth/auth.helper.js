const crypto = require("crypto");
const {
  MAX_LOGIN_ATTEMPTS,
  LOCK_TIME,
  VERIFICATION_TOKEN_EXPIRES_TIME,
  RESET_PASSWORD_TOKEN_EXPIRES_TIME,
} = require("./auth.constant");
const { AppError } = require("../../middlewares/errorHandler");
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};
const getVerificationTokenExpiresAt = () => {
  return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_TIME);
};
const getResetPasswordTokenExpiresAt = () => {
  return new Date(Date.now() + RESET_PASSWORD_TOKEN_EXPIRES_TIME);
};
const ensureUserCanLogin = (user) => {
  if (!user) {
    throw new AppError("Email hoặc mật khẩu không đúng", 401);
  }
  if (!user.isEmailVerified) {
    throw new AppError("Vui lòng xác thực email trước khi đăng nhập", 401);
  }
  if (!user.isActive) {
    throw new AppError(
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên",
      401,
    );
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError(
      "Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.",
      423,
    );
  }
};
const buildFailedLoginPayload = (user) => {
  const failedLoginAttempts = user.failedLoginAttempts + 1;
  let lockUntil = null;
  if (failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    lockUntil = new Date(Date.now() + LOCK_TIME);
  }
  return {
    failedLoginAttempts,
    lockUntil,
  };
};

module.exports = {
  getVerificationTokenExpiresAt,
  generateRandomToken,
  getResetPasswordTokenExpiresAt,
  ensureUserCanLogin,
  buildFailedLoginPayload,
};
