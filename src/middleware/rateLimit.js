// src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // Limit each IP
  message: { success: false, message: 'Too many requests' },
});

export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // Stricter for auth