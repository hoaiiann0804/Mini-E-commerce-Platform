/**
 * Script tạo tài khoản admin
 * Sử dụng: node scripts/create-admin-user.js
 */

const { User } = require("../src/models");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function createAdminUser() {
  try {
    // //console.log('🚀 Bắt đầu tạo tài khoản admin...');

    // Thông tin admin
    const adminData = {
      id: uuidv4(),
      email: "admin@example.com",
      password: "Admin@123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      isEmailVerified: true,
      isActive: true,
    };

    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = await User.findOne({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      //console.log('⚠️ Tài khoản admin đã tồn tại!');
      //console.log(`📧 Email: ${adminData.email}`);
      //console.log('🔑 Mật khẩu: (giữ nguyên mật khẩu hiện tại)');
      return;
    }

    // Tạo admin user
    await User.create({
      ...adminData,
    });

    //console.log('✅ Tạo tài khoản admin thành công!');
    //console.log(`📧 Email: ${adminData.email}`);
    //console.log(`🔑 Mật khẩu: ${adminData.password}`);
  } catch (error) {
    console.error("❌ Lỗi khi tạo tài khoản admin:", error);
  } finally {
    process.exit(0);
  }
}

// Chạy function
createAdminUser();
