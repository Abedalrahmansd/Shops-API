// src/routes/user.js
import express from 'express';
import { getMe, updateMe, addPhone, deactivate, reactivate, getUser } from '../controllers/user.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';

const upload = multer({ dest: 'src/uploads/avatars/' });

const router = express.Router();
router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, upload.single('avatar'), updateMe);
router.post('/me/phone', authMiddleware, addPhone);
router.delete('/me', authMiddleware, deactivate);
router.post('/me/reactivate', authMiddleware, reactivate);
router.get('/:id', getUser); // Public

export default router;