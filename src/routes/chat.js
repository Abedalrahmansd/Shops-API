// src/routes/chat.js
import express from 'express';
import { getChats } from '../controllers/chat.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getChats);

export default router;