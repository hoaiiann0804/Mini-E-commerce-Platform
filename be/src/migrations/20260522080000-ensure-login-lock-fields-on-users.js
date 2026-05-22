'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    if (!table.failedLoginAttempts) {
      await queryInterface.addColumn('users', 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.lockUntil) {
      await queryInterface.addColumn('users', 'lock_until', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    if (table.failedLoginAttempts) {
      await queryInterface.removeColumn('users', 'failed_login_attempts');
    }

    if (table.lockUntil) {
      await queryInterface.removeColumn('users', 'lock_until');
    }
  },
};

