const jwt = require("jsonwebtoken");

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = "15m";
const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = "7d";

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_ACCESS_TOKEN_EXPIRES_IN,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn:
        process.env.JWT_REFRESH_EXPIRES_IN || DEFAULT_REFRESH_TOKEN_EXPIRES_IN,
    },
  );
};

const verifyRefreshToken = (refreshToken) => {
  return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
};

const getRefreshTokenExpiresAt = (refreshToken) => {
  const decoded = jwt.decode(refreshToken);
  if (!decoded?.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiresAt,
};
