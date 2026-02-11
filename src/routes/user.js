// src/routes/user.js
import express from 'express';
import { getMe, updateMe, addPhone, changePassword, deleteAccount, deactivate, reactivate, getUser } from '../controllers/user.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate, updateMeSchema, addPhoneSchema, changePasswordSchema, deleteAccountSchema } from '../middleware/validate.js';

const router = express.Router();

// Authenticated routes
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, upload.single('avatar'), validate(updateMeSchema), updateMe);
router.post('/me/phone', authMiddleware, validate(addPhoneSchema), addPhone);
router.post('/me/change-password', authMiddleware, validate(changePasswordSchema), changePassword);
router.post('/me/deactivate', authMiddleware, deactivate);
router.post('/me/reactivate', authMiddleware, reactivate);
router.post('/me/delete', authMiddleware, validate(deleteAccountSchema), deleteAccount);

// Public routes
router.get('/:id', getUser);

export default router;