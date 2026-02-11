// src/routes/analytics.js
import express from 'express';
import { getShopAnalytics, getProductAnalytics } from '../controllers/analytics.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner } from '../middleware/owner.js';

const router = express.Router();

router.get('/shop/:shopId', authMiddleware, isShopOwner, getShopAnalytics);
router.get('/product/:productId', authMiddleware, getProductAnalytics);

export default router;