import dotenv from 'dotenv';
dotenv.config();
export const config = {
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_URI: process.env.DB_URI,
  DB_URI_TEST: process.env.DB_URI_TEST,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  APP_VERSION: process.env.APP_VERSION,
};