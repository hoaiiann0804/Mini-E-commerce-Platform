require("dotenv").config();

const toBool = (value) => String(value).toLowerCase() === "true";

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || "ecommerce_test",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      ssl: toBool(process.env.DB_SSL || "true")
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
    pool: {
      // Neon has limited concurrent connections; keep pool small in production
      max: Number(process.env.DB_POOL_MAX) || 2,
      min: Number(process.env.DB_POOL_MIN) || 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
