const { token } = require("morgan");
const User = require("../user/user.model");
const { Op, where } = require("sequelize");
const { RefreshToken } = require("../../models");

const findUserByEmail = async (email) => {
  return User.findOne({
    where: { email },
  });
};
const findUserById = async (id) => {
  return User.findByPk(id);
};
// hàm kiểm tra token có hợp lệ ko
// Token còn hạng hay không
const findUserByValidVerificationToken = async (token) => {
  return User.findOne({
    where: {
      verificationToken: token,
      verificationTokenExpires: {
        [Op.gt]: new Date(),
      },
    },
  });
};

const findUserByResetPasswordToken = async (token) => {
  return User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        [Op.gt]: new Date(),
      },
    },
  });
};

const findUserProfileById = async (userId) => {
  return User.findByPk(userId, {
    include: [
      {
        association: "addresses",
        attributes: {
          exclude: ["userId"],
        },
      },
    ],
  });
};
const createUser = async (payload) => {
  return User.create(payload);
};

const updateUser = async (user, payload) => {
  return user.update(payload);
};

const createRefreshToken = async ({ userId, token, expiresAt }) => {
  return RefreshToken.create({
    userId,
    token,
    expiresAt,
  });
};

const findValidRefreshToken = async (refreshToken) => {
  return RefreshToken.findOne({
    where: {
      token: refreshToken,
      revokedAt: null,
      expiresAt: {
        //ngày hết hạn phải lớn hơn thời gian hiện tại
        [Op.gt]: new Date(),
      },
    },
  });
};

const revokeRefreshToken = (token) => {
  return RefreshToken.update(
    {
      revokedAt: new Date(),
    },
    {
      where: {
        token,
        revokedAt: null,
      },
    },
  );
};
const findUserByGoogleId = async (googleId) => {
  return User.findOne({
    where: { googleId },
  });
};

const findUserByFacebookId = async (facebookId) => {
  return User.findOne({
    where: { facebookId },
  });
};

const createOAuthUser = async ({
  email,
  firstName,
  lastName,
  avatar,
  googleId,
  facebookId,
  provider,
}) => {
  return User.create({
    email,
    firstName: firstName || "User",
    lastName: lastName || "",
    avatar: avatar || null,
    googleId: googleId || null,
    facebookId: facebookId || null,
    provider: provider || "local",
    isEmailVerified: true,
    isActive: true,
  });
};

const linkOAuthProvider = async (user, { googleId, facebookId, avatar }) => {
  const updateData = {};
  if (googleId && !user.googleId) updateData.googleId = googleId;
  if (facebookId && !user.facebookId) updateData.facebookId = facebookId;
  if (avatar && !user.avatar) updateData.avatar = avatar;
  if (!user.isEmailVerified) updateData.isEmailVerified = true;

  return user.update(updateData);
};

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByGoogleId,
  findUserByFacebookId,
  findUserByValidVerificationToken,
  findUserByResetPasswordToken,
  findUserProfileById,
  createUser,
  createOAuthUser,
  linkOAuthProvider,
  updateUser,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
};
