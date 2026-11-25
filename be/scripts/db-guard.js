"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { Client } = require("pg");
const { Sequelize } = require("sequelize");

const ALLOWED_LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "db",
  "postgres",
  "e-commerce-postgres",
  "host.docker.internal",
]);

const FORBIDDEN_DB_NAMES = new Set([
  "websitebanhangmini",
  "production",
  "prod",
  "defaultdb",
  "neondb",
]);

const DEFAULT_BENCH_DB = "ecommerce_bench";

/**
 * Extracts hostname and database name from a Postgres connection URL.
 */
function parseConnectionUrl(rawUrl, envVarName) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new Error(
      `[DB-GUARD] Invalid URL in ${envVarName}: "${rawUrl}" (${err.message})`
    );
  }
  const hostname = (parsed.hostname || "").toLowerCase();
  const dbName = (parsed.pathname || "").replace(/^\//, "");
  return { hostname, dbName, port: Number(parsed.port) || 5432 };
}

/**
 * Guard that MUST run before any database connection is opened.
 * Blocks execution if:
 * 1. NODE_ENV === 'production'
 * 2. DB_SSL === 'true'
 * 3. DATABASE_URL / DIRECT_DATABASE_URL / DB_HOST points to a non-local host
 * 4. Target benchmark database name collides with the dev/prod database name
 */
function assertLocalBenchmarkEnvironment() {
  const nodeEnv = String(process.env.NODE_ENV || "development")
    .trim()
    .toLowerCase();

  if (nodeEnv === "production" || nodeEnv === "prod") {
    throw new Error(
      `[DB-GUARD] BLOCKED: Cannot run seed/benchmark when NODE_ENV="${process.env.NODE_ENV}". Only local development/benchmark environments are allowed.`
    );
  }

  const dbSsl = String(process.env.DB_SSL || "false")
    .trim()
    .toLowerCase();
  if (dbSsl === "true" || dbSsl === "1") {
    throw new Error(
      `[DB-GUARD] BLOCKED: DB_SSL="${process.env.DB_SSL}" indicates a remote/cloud database connection. Benchmark is restricted to local Docker PostgreSQL.`
    );
  }

  for (const urlVar of ["DATABASE_URL", "DIRECT_DATABASE_URL"]) {
    const rawVal = process.env[urlVar];
    if (rawVal && String(rawVal).trim() !== "") {
      const { hostname } = parseConnectionUrl(String(rawVal).trim(), urlVar);
      if (!ALLOWED_LOCAL_HOSTS.has(hostname)) {
        throw new Error(
          `[DB-GUARD] BLOCKED: ${urlVar} points to non-local host "${hostname}". Allowed hosts: ${Array.from(
            ALLOWED_LOCAL_HOSTS
          ).join(", ")}`
        );
      }
      if (
        rawVal.includes("sslmode=require") ||
        rawVal.includes("neon.tech") ||
        rawVal.includes("supabase.") ||
        rawVal.includes("amazonaws.com")
      ) {
        throw new Error(
          `[DB-GUARD] BLOCKED: ${urlVar} contains cloud/SSL markers.`
        );
      }
    }
  }

  const host = String(process.env.BENCH_DB_HOST || process.env.DB_HOST || "localhost")
    .trim()
    .toLowerCase();

  if (!ALLOWED_LOCAL_HOSTS.has(host)) {
    throw new Error(
      `[DB-GUARD] BLOCKED: Target host "${host}" is not in the local Docker whitelist (${Array.from(
        ALLOWED_LOCAL_HOSTS
      ).join(", ")}).`
    );
  }

  const port = Number(process.env.BENCH_DB_PORT || process.env.DB_PORT || 6000);
  const user = process.env.BENCH_DB_USER || process.env.DB_USER || "postgres";
  const password =
    process.env.BENCH_DB_PASSWORD || process.env.DB_PASSWORD || "123456";
  const benchDbName = String(
    process.env.BENCH_DB_NAME || DEFAULT_BENCH_DB
  ).trim();

  if (
    FORBIDDEN_DB_NAMES.has(benchDbName.toLowerCase()) ||
    benchDbName.toLowerCase() ===
      String(process.env.DB_NAME || "").trim().toLowerCase()
  ) {
    throw new Error(
      `[DB-GUARD] BLOCKED: Benchmark database "${benchDbName}" must be isolated from dev/prod database "${process.env.DB_NAME}". Use "${DEFAULT_BENCH_DB}".`
    );
  }

  if (!/^[a-zA-Z0-9_]+$/.test(benchDbName)) {
    throw new Error(
      `[DB-GUARD] BLOCKED: Invalid benchmark database identifier "${benchDbName}".`
    );
  }

  return {
    nodeEnv,
    host,
    port,
    user,
    password,
    database: benchDbName,
    devDatabaseIgnored: process.env.DB_NAME || "(unset)",
  };
}

/**
 * Ensures the isolated benchmark database (`ecommerce_bench`) exists
 * in the local Docker PostgreSQL container without touching `websitebanhangmini`.
 */
async function ensureBenchmarkDatabase() {
  const cfg = assertLocalBenchmarkEnvironment();

  const adminClient = new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: "postgres",
  });

  await adminClient.connect();
  try {
    const checkRes = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [cfg.database]
    );
    let created = false;
    if (checkRes.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${cfg.database}"`);
      created = true;
    }
    return { ...cfg, created };
  } finally {
    await adminClient.end();
  }
}

/**
 * Creates a Sequelize instance bound strictly to the isolated `ecommerce_bench` DB.
 */
function createBenchmarkSequelize(cfg) {
  return new Sequelize(cfg.database, cfg.user, cfg.password, {
    host: cfg.host,
    port: cfg.port,
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 10,
      min: 1,
      acquire: 60000,
      idle: 10000,
    },
  });
}

module.exports = {
  ALLOWED_LOCAL_HOSTS,
  DEFAULT_BENCH_DB,
  assertLocalBenchmarkEnvironment,
  ensureBenchmarkDatabase,
  createBenchmarkSequelize,
};

