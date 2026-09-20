"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "payment_quote", { type: Sequelize.JSON, allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "payment_quote");
  },
};
