const path = require("path");
const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(3333),
  HOST: Joi.string().default("localhost"),
  APP_NAME: Joi.string().default("Programa Social"),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ["postgres", "postgresql"] })
    .optional(),
  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.number().integer().min(1).max(65535).default(5432),
  DB_USER: Joi.string().default("postgres"),
  DB_PASSWORD: Joi.string().allow("").default(""),
  DB_NAME: Joi.string().default("programas_sociais_db"),
  DB_ADMIN_DATABASE: Joi.string().default("postgres"),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),
  JWT_SECRET: Joi.string().min(8).required(),
  JWT_REFRESH_SECRET: Joi.string()
    .min(8)
    .default("refresh-secret-dev-only-change-me"),
  JWT_EXPIRATION: Joi.string().default("1h"),
  JWT_REFRESH_EXPIRATION: Joi.string().default("7d"),
  BCRYPT_ROUNDS: Joi.number().integer().min(8).max(15).default(10),
  EMAIL_NOTIFICATIONS_ENABLED: Joi.boolean().truthy("true").falsy("false").default(false),
  EMAIL_HOST: Joi.string().allow("").default(""),
  EMAIL_PORT: Joi.number().integer().min(1).max(65535).default(587),
  EMAIL_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
  EMAIL_USER: Joi.string().allow("").default(""),
  EMAIL_PASSWORD: Joi.string().allow("").default(""),
  EMAIL_FROM: Joi.string().allow("").default(""),
  EMAIL_FROM_NAME: Joi.string().allow("").default(""),
  WEBHOOK_NOTIFICATIONS_ENABLED: Joi.boolean().truthy("true").falsy("false").default(false),
  WEBHOOK_URL: Joi.string().uri().allow("").default(""),
  WEBHOOK_SECRET: Joi.string().allow("").default(""),
}).unknown(true);

function buildDatabaseUrl({
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
}) {
  const encodedUser = encodeURIComponent(DB_USER);
  const encodedPassword = encodeURIComponent(DB_PASSWORD);

  return `postgresql://${encodedUser}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

function loadEnv(source = process.env) {
  const { error, value } = envSchema.validate(source, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Invalid environment configuration: ${error.message}`);
  }

  const databaseUrl =
    value.DATABASE_URL ||
    buildDatabaseUrl({
      DB_HOST: value.DB_HOST,
      DB_PORT: value.DB_PORT,
      DB_USER: value.DB_USER,
      DB_PASSWORD: value.DB_PASSWORD,
      DB_NAME: value.DB_NAME,
    });

  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    host: value.HOST,
    appName: value.APP_NAME,
    databaseUrl,
    databaseConfig: {
      host: value.DB_HOST,
      port: value.DB_PORT,
      user: value.DB_USER,
      password: value.DB_PASSWORD,
      database: value.DB_NAME,
      adminDatabase: value.DB_ADMIN_DATABASE,
      min: value.DB_POOL_MIN,
      max: value.DB_POOL_MAX,
    },
    jwtSecret: value.JWT_SECRET,
    jwtRefreshSecret: value.JWT_REFRESH_SECRET,
    jwtExpiration: value.JWT_EXPIRATION,
    jwtRefreshExpiration: value.JWT_REFRESH_EXPIRATION,
    bcryptRounds: value.BCRYPT_ROUNDS,
    email: {
      enabled: value.EMAIL_NOTIFICATIONS_ENABLED,
      host: value.EMAIL_HOST,
      port: value.EMAIL_PORT,
      secure: value.EMAIL_SECURE,
      user: value.EMAIL_USER,
      password: value.EMAIL_PASSWORD,
      fromAddress: value.EMAIL_FROM,
      fromName: value.EMAIL_FROM_NAME,
    },
    webhook: {
      enabled: value.WEBHOOK_NOTIFICATIONS_ENABLED,
      url: value.WEBHOOK_URL || "",
      secret: value.WEBHOOK_SECRET || "",
    },
  };
}

module.exports = { loadEnv, buildDatabaseUrl };
