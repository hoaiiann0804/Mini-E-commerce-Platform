"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("addresses", "district_code");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("addresses", "district_code", {
      type: Sequelize.STRING,
    });
  },
};
