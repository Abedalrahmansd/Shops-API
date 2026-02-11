// src/routes/auth.js
import express from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, resendVerification, googleAuth, googleCallback } from '../controllers/auth.js';
import { validate, registerSchema } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();
router.use(authLimiter);
router.post('/register', validate(registerSchema), register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// router.post('/social-login', socialLogin);
router.get('/google/callback', googleCallback);
router.get('/google', googleAuth);

export default router;