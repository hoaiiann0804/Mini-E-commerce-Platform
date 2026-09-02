'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Cho phép password null (dành cho OAuth users)
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 2. Thêm google_id
    await queryInterface.addColumn('users', 'google_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // 3. Thêm facebook_id
    await queryInterface.addColumn('users', 'facebook_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // 4. Thêm provider enum
    await queryInterface.addColumn('users', 'provider', {
      type: Sequelize.ENUM('local', 'google', 'facebook'),
      allowNull: false,
      defaultValue: 'local',
    });

    // 5. Thêm index cho google_id và facebook_id
    await queryInterface.addIndex('users', ['google_id']);
    await queryInterface.addIndex('users', ['facebook_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', ['google_id']);
    await queryInterface.removeIndex('users', ['facebook_id']);
    await queryInterface.removeColumn('users', 'provider');
    await queryInterface.removeColumn('users', 'facebook_id');
    await queryInterface.removeColumn('users', 'google_id');
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
