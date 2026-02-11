// src/routes/chat.js
import express from 'express';
import { getChats, getChatHistory, sendMessage, deleteMessage } from '../controllers/chat.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, sendMessageSchema } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authMiddleware, getChats);
router.get('/:shopId/history', authMiddleware, getChatHistory);
router.post('/:shopId/send', authMiddleware, validate(sendMessageSchema), sendMessage);
router.delete('/:messageId', authMiddleware, deleteMessage);

export default router;