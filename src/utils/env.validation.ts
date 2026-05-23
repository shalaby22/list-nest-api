import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  PORT: Joi.number().default(3000),
  APP_HOST: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),

  REDIS_URL: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().required(),
  REFRESH_EXPIRATION_IN_DAYS: Joi.string().required(),
  REFRESH_RESET_PASSWORD_IN_MINUTES: Joi.number().required(),
  JWT_VERIFY_EMAIL_SECRET: Joi.string().required(),
  JWT_VERIFY_EMAIL_EXPIRATION: Joi.string().required(),

  MAPTILER_KEY: Joi.string().required(),

  CLOUDINARY_API_SECRET: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_NAME: Joi.string().required(),

  SENDGRID_API_KEY: Joi.string().required(),
  GMAIL_APP_EMAIL: Joi.string().required(),
});
