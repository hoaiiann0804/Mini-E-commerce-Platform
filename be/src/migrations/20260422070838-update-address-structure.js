"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("addresses", "province", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "",
    });
    // await queryInterface.addColumn("addresses", "district", {
    //   type: Sequelize.STRING,
    //   allowNull: false,
    //   defaultValue: "",
    // });

    await queryInterface.addColumn("addresses", "ward", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "",
    });

    await queryInterface.addColumn("addresses", "province_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("addresses", "district_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("addresses", "ward_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("addresses", "lat", {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true,
    });

    await queryInterface.addColumn("addresses", "lng", {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "city", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "state", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "country", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "zip", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("addresses", "province");
    await queryInterface.removeColumn("addresses", "ward");

    await queryInterface.removeColumn("addresses", "province_code");
    await queryInterface.removeColumn("addresses", "ward_code");

    await queryInterface.removeColumn("addresses", "lat");
    await queryInterface.removeColumn("addresses", "lng");
  },
};
