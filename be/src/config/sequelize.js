const { Sequelize } = require('sequelize');
Sequelize.useCLS(require('./transactionContext'));
const config = require('./database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const toBool = (value) => String(value).toLowerCase() === 'true';

const isNeonOrSslUrl = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('sslmode=require') || process.env.DATABASE_URL.includes('neon.tech'));

const dialectOptions = {
  ...dbConfig.dialectOptions,
  ...(toBool(process.env.DB_SSL) || isNeonOrSslUrl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {}),
};

const commonOptions = {
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  define: dbConfig.define,
  dialectOptions,
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
