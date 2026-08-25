const jwt = require("jsonwebtoken");
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
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
