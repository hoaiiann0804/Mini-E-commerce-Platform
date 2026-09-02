const { AppError } = require("../../middlewares/errorHandler");
const {
  generateRandomToken,
  ensureUserCanLogin,
  buildFailedLoginPayload,
  getVerificationTokenExpiresAt,
  getResetPasswordTokenExpiresAt,
} = require("./auth.helper");
const authRepository = require("./auth.repository");
const emailService = require("../../shared/services/email/emailService");
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  verifyRefreshToken,
} = require("../../shared/utils/token.util");

const register = async ({ email, password, firstName, lastName, phone }) => {
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("Email đã được sử dụng", 409);
  }
  const verificationToken = generateRandomToken();
  const user = await authRepository.createUser({
    email,
    password,
    firstName,
    lastName,
    phone,
    verificationToken,
    verificationTokenExpires: getVerificationTokenExpiresAt(),
  });
  await emailService.sendVerificationEmail(email, verificationToken);
  return {
    message:
      "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
  };
};

const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);
  ensureUserCanLogin(user);
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const failedLoginPayload = buildFailedLoginPayload(user);
    await authRepository.updateUser(user, failedLoginPayload);
    throw new AppError("Email hoặc mật khẩu không đúng", 401);
  }
  await authRepository.updateUser(user, {
    failedLoginAttempts: 0,
    lockUntil: null,
  });
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt(refreshToken);
  await authRepository.createRefreshToken({
    userId: user.id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt,
  });
  return {
    token,
    refreshToken,
    user: user.toJSON(),
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return true;
  }
  await authRepository.revokeRefreshToken(refreshToken);
  return true;
};

const verifyEmail = async (token) => {
  const user = await authRepository.findUserByValidVerificationToken(token);
  if (!user) {
    throw new AppError("Token không hợp lệ hoặc đã hết hạn", 400);
  }
  await authRepository.updateUser(user, {
    isEmailVerified: true,
    verificationToken: null,
  });
  return {
    message: "Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ.",
  };
};

const resendVerification = async (email) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    return;
  }
  if (user.isEmailVerified) {
    return;
  }
  const verificationToken = generateRandomToken();
  await authRepository.updateUser(user, {
    verificationToken,
    verificationTokenExpires: getVerificationTokenExpiresAt(),
  });
  await emailService.sendVerificationEmail(
    user.email,
    verificationToken,
    "resend",
  );
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("Refresh token không hợp lệ", 401);
  }
  let decoded;
  try {
    //1. Refresh token có đúng chữ ký của server không?
    //2. Refresh token có hết hạn chưa?

    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401);
  }
  //Refresh token này có thật sự tồn tại trong hệ thống không?
  // Refresh token này đã logout/revoke chưa?
  // Refresh token này còn hạn theo DB không?
  const storedRefreshToken =
    await authRepository.findValidRefreshToken(refreshToken);
  if (!storedRefreshToken) {
    throw new AppError("Refresh token không hợp lệ hoặc đã bị thu hồi", 401);
  }
  const user = await authRepository.findUserById(decoded.id);
  if (!user) {
    throw new AppError("Refresh token không hợp lệ", 401);
  }
  if (!user.isActive) {
    throw new AppError(
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên",
      401,
    );
  }
  const token = generateAccessToken(user);
  return {
    token,
  };
};

const forgotPassword = async (email) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    return;
  }
  const resetToken = generateRandomToken();
  authRepository.updateUser(user, {
    resetPasswordToken: resetToken,
    resetPasswordExpires: getResetPasswordTokenExpiresAt(),
  });
  await emailService.sendResetPasswordEmail(email, resetToken);
};

const resetPassword = async ({ token, password }) => {
  const user = await authRepository.findUserByResetPasswordToken(token);
  if (!user) {
    throw new AppError("Token không hợp lệ hoặc đã hết hạn", 400);
  }
  await authRepository.updateUser(user, {
    password,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });
  return {
    message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.",
  };
};

const getCurrentUser = async (userIdOrObj) => {
  const userId =
    typeof userIdOrObj === "object" && userIdOrObj !== null
      ? userIdOrObj.userId || userIdOrObj.id
      : userIdOrObj;

  const user = await authRepository.findUserProfileById(userId);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }
  return user.toJSON();
};

const loginWithOAuth = async ({ provider, profile }) => {
  const { id: providerId, emails, name, displayName, photos } = profile;
  const email = emails && emails.length > 0 ? emails[0].value.toLowerCase() : null;
  const avatar = photos && photos.length > 0 ? photos[0].value : null;

  let firstName = name?.givenName;
  let lastName = name?.familyName;

  if (!firstName && displayName) {
    const parts = displayName.trim().split(" ");
    if (parts.length === 1) {
      firstName = parts[0];
      lastName = "";
    } else {
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
    }
  }

  firstName = firstName || "User";
  lastName = lastName || "";

  let user = null;

  // 1. Tìm user theo provider ID
  if (provider === "google") {
    user = await authRepository.findUserByGoogleId(providerId);
  } else if (provider === "facebook") {
    user = await authRepository.findUserByFacebookId(providerId);
  }

  // 2. Nếu chưa có providerId, tìm user theo email để link account
  if (!user && email) {
    user = await authRepository.findUserByEmail(email);
    if (user) {
      await authRepository.linkOAuthProvider(user, {
        googleId: provider === "google" ? providerId : null,
        facebookId: provider === "facebook" ? providerId : null,
        avatar,
      });
    }
  }

  // 3. Nếu vẫn không có -> tạo user mới
  if (!user) {
    if (!email) {
      throw new AppError(
        "Không tìm thấy email từ tài khoản mạng xã hội của bạn. Vui lòng cấp quyền truy cập email.",
        400
      );
    }
    user = await authRepository.createOAuthUser({
      email,
      firstName,
      lastName,
      avatar,
      googleId: provider === "google" ? providerId : null,
      facebookId: provider === "facebook" ? providerId : null,
      provider,
    });
  }

  // 4. Kiểm tra tài khoản có bị khóa không
  if (!user.isActive) {
    throw new AppError(
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên",
      401
    );
  }

  // Reset failed login attempts
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    await authRepository.updateUser(user, {
      failedLoginAttempts: 0,
      lockUntil: null,
    });
  }

  // 5. Generate tokens
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenExpiresAt = getRefreshTokenExpiresAt(refreshToken);
  await authRepository.createRefreshToken({
    userId: user.id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt,
  });

  return {
    token,
    refreshToken,
    user: user.toJSON(),
  };
};

module.exports = {
  register,
  login,
  loginWithOAuth,
  logout,
  verifyEmail,
  resendVerification,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
