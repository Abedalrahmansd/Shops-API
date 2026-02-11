// src/routes/auth.js
import express from 'express';
import { register, login, refreshToken, verifyEmail, forgotPassword, resetPassword, resendVerification, googleAuth, googleCallback, logout } from '../controllers/auth.js';
import { validate, registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, resendVerificationSchema, resetPasswordSchema } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authLimiter);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', authMiddleware, logout);

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;