const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Address = sequelize.define(
  "Address",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // district: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    // },
    ward: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinceCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // districtCode: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },

    wardCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "addresses",
    timestamps: true,
  }
);
module.exports = Address;
