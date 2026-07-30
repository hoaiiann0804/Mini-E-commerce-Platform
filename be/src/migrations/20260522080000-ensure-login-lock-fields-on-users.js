'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    const hasFailedLoginAttemptsSnake = Boolean(table.failed_login_attempts);
    const hasFailedLoginAttemptsCamel = Boolean(table.failedLoginAttempts);
    const hasLockUntilSnake = Boolean(table.lock_until);
    const hasLockUntilCamel = Boolean(table.lockUntil);

    // Prefer snake_case columns (repo uses `define.underscored: true`).
    // If legacy camelCase columns exist, keep them to avoid destructive migrations.
    if (!hasFailedLoginAttemptsSnake && !hasFailedLoginAttemptsCamel) {
      await queryInterface.addColumn('users', 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!hasLockUntilSnake && !hasLockUntilCamel) {
      await queryInterface.addColumn('users', 'lock_until', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    // Remove only the snake_case columns that this migration adds.
    if (table.failed_login_attempts) {
      await queryInterface.removeColumn('users', 'failed_login_attempts');
    }

    if (table.lock_until) {
      await queryInterface.removeColumn('users', 'lock_until');
    }
  },
};

