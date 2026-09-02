const authService = require("./auth.service");
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({
      status: "success",
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    // Do chỉ có 1 body là refreshToken nên chỉ cần truyền req.body.refreshToken
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await authService.verifyEmail(token); // có thể truyền thẳng ( req.params.token ) nhưng cách trên dễ nhìn hơn
    return res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailWithToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.verifyEmail(token); // có thể truyền thẳng ( req.body.token ) nhưng cách trên dễ nhìn hơn
    return res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.resendVerification(email);
    return res.status(200).json({
      status: "success",
      message: "Email xác thực đã được gửi lại thành công.",
    }); 
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    return res.status(200).json({
      status: "success",
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return res.status(200).json({
      status: "success",
      message:
        "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
    });
  } catch (error) {
    next(error);
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return res.status(200).json({
      status: "success",
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const handleOAuthCallback = async (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5175";
  try {
    if (!req.user || !req.user.token) {
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    const { token, refreshToken } = req.user;
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${encodeURIComponent(
        token
      )}&refreshToken=${encodeURIComponent(refreshToken)}`
    );
  } catch (error) {
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(
        error.message || "oauth_failed"
      )}`
    );
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  verifyEmailWithToken,
  resendVerification,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  refreshAccessToken,
  handleOAuthCallback,
};
