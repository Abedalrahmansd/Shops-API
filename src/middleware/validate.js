// src/middleware/validate.js
import Joi from 'joi';

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false }); // Show all errors
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return res.status(400).json({ success: false, message: 'Validation error', details: messages });
  }
  next();
};

// Auth Schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(3).required(),
  bio: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().required(),
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});

// User Schemas
export const updateMeSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  bio: Joi.string().optional(),
  interests: Joi.array().items(Joi.string()).optional(),
});

export const addPhoneSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(), // E.164 format
});

// Shop Schemas
export const createShopSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  uniqueId: Joi.string().alphanum().optional(),
});

export const updateShopSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  customization: Joi.object().optional(),
  icon: Joi.object().optional(),
  messageTemplate: Joi.string().optional(),
});

export const setPrimarySchema = Joi.object({
  shopId: Joi.string().hex().length(24).required(), // Mongo ObjectId
});

export const reportShopSchema = Joi.object({
  reason: Joi.string().min(10).required(),
});

// Product Schemas
export const createProductSchema = Joi.object({
  title: Joi.string().min(3).required(),
  description: Joi.string().optional(),
  price: Joi.number().positive().required(),
  currency: Joi.string().default('USD').optional(),
  stock: Joi.number().integer().min(0).optional(),
  sectionName: Joi.string().optional(),
});

export const updateProductSchema = Joi.object({
  title: Joi.string().min(3).optional(),
  description: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  currency: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional(),
});

// Cart Schemas
export const addToCartSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).default(1).optional(),
  shopId: Joi.string().hex().length(24).required(),
});

// Review Schemas
export const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().optional(),
});

export const reportReviewSchema = Joi.object({
  reason: Joi.string().min(10).required(),
});

// Admin Schemas (if bodies added later; currently none, but for resolveReport if params only)
export const resolveReportSchema = Joi.object({
  action: Joi.string().valid('delete', 'warn', 'ignore').optional(), // If expanding
  note: Joi.string().optional(),
});

// Chat Schemas (for sendMessage)
export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).required(),
  productId: Joi.string().hex().length(24).optional(),
});

// Notification Schemas (if added from previous)
export const markReadSchema = Joi.object({
  notificationId: Joi.string().hex().length(24).required(),
});

export const markAllReadSchema = Joi.object({
  // No body required
});

export const deleteNotificationSchema = Joi.object({
  notificationId: Joi.string().hex().length(24).required(),
});

export const updateProfilePictureSchema = Joi.object({
  image: Joi.string().required(), // Base64 or URL
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

export const deleteAccountSchema = Joi.object({
  password: Joi.string().required(),
});

export const updateShopBannerSchema = Joi.object({
  banner: Joi.string().required(),
});

export const addProductImageSchema = Joi.object({
  image: Joi.string().required(),
});

export const deleteProductImageSchema = Joi.object({
  imageId: Joi.string().hex().length(24).required(),
});

