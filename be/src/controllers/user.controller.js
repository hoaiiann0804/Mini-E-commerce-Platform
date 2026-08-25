const { User, Address } = require("../models");
const { AppError } = require("../middlewares/errorHandler");

const normalAddressData = (payload = {}) => {
  const {
    name,
    firstName,
    lastName,
    company,
    address1,
    address2,
    province,
    ward,
    provinceCode,
    wardCode,
    lat,
    lng,
    city,
    state,
    zip,
    country,
    phone,
    isDefault,
  } = payload;

  return {
    name,
    firstName,
    lastName,
    company,
    address1,
    address2,
    province,
    ward,
    provinceCode,
    wardCode,
    lat,
    lng,
    city,
    state,
    zip,
    country,
    phone,
    isDefault: !!isDefault,
  };
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("Không tìm thấy người dùng", 404);
    }

    // Update user
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone !== undefined ? phone : user.phone;
    user.avatar = avatar || user.avatar;

    await user.save();

    res.status(200).json({
      status: "success",
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("Không tìm thấy người dùng", 404);
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError("Mật khẩu hiện tại không đúng", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Get user addresses
const getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find addresses
    const addresses = await Address.findAll({
      where: { userId },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
    const result = addresses.map((addr) => ({
      id: addr.id,
      name: addr.name,
      firstName: addr.firstName,
      lastName: addr.lastName,
      company: addr.company,

      address1: addr.address1,
      address2: addr.address2,

      province: addr.province,
      ward: addr.ward,
      provinceCode: addr.provinceCode,
      wardCode: addr.wardCode,

      city: addr.city,
      state: addr.state,
      country: addr.country,
      zip: addr.zip,
      phone: addr.phone,

      lat: addr.lat,
      lng: addr.lng,
      isDefault: addr.isDefault,
    }));

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Add new address
const addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addressData = normalAddressData(req.body);

    // Check if this is the first address
    const addressCount = await Address.count({ where: { userId } });
    if (addressCount === 0) {
      addressData.isDefault = true;
    }

    // If setting as default, update other addresses
    if (addressData.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    // Create address
    const address = await Address.create({
      ...addressData,
      userId,
    });

    res.status(201).json({
      status: "success",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// Update address
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const addressData = normalAddressData(req.body);

    // Find address
    const address = await Address.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new AppError("Không tìm thấy địa chỉ", 404);
    }

    // If setting as default, update other addresses
    if (addressData.isDefault && !address.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId, isDefault: true } }
      );
    }

    // Update address
    await address.update(addressData);

    res.status(200).json({
      status: "success",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// Delete address
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find address
    const address = await Address.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new AppError("Không tìm thấy địa chỉ", 404);
    }

    // Delete address
    await address.destroy();

    // If deleted address was default, set another address as default
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });

      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.status(200).json({
      status: "success",
      message: "Xóa địa chỉ thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Set default address
const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find address
    const address = await Address.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new AppError("Không tìm thấy địa chỉ", 404);
    }

    // Update other addresses
    await Address.update(
      { isDefault: false },
      { where: { userId, isDefault: true } }
    );

    // Set as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      status: "success",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
