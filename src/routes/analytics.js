// src/routes/analytics.js
import express from 'express';
import { getShopAnalytics } from '../controllers/analytics.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner } from '../middleware/owner.js';

const router = express.Router();
router.get('/shop/:shopId', authMiddleware, isShopOwner, getShopAnalytics);

export default router;