// src/routes/notification.js
import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../controllers/notification.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.patch('/:notificationId/read', authMiddleware, markAsRead);
router.patch('/mark-all-read', authMiddleware, markAllAsRead);
router.delete('/:notificationId', authMiddleware, deleteNotification);
router.delete('/', authMiddleware, clearAllNotifications);

export default router;