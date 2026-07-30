'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    // Make this migration idempotent in case columns were added manually in dev.
    if (!table.failed_login_attempts) {
      await queryInterface.addColumn('users', 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.lock_until) {
      await queryInterface.addColumn('users', 'lock_until', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    if (table.failed_login_attempts) {
      await queryInterface.removeColumn('users', 'failed_login_attempts');
    }

    if (table.lock_until) {
      await queryInterface.removeColumn('users', 'lock_until');
    }
  },
};
