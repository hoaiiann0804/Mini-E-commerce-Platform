const { Sequelize } = require('sequelize');
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const commonOptions = {
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  define: dbConfig.define,
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      port: dbConfig.port,
      ...commonOptions,
    });

module.exports = sequelize;
