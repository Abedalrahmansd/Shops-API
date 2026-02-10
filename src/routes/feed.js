// src/routes/feed.js - New
import express from 'express';
import { getFeed } from '../controllers/feed.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/', authMiddleware, getFeed);

export default router;