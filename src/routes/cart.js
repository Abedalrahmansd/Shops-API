// src/routes/cart.js
import express from 'express';
import { getCart, addToCart, removeItem } from '../controllers/cart.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.get('/me', authMiddleware, getCart);
router.post('/add', authMiddleware, addToCart);
router.delete('/item/:productId', authMiddleware, removeItem);

export default router;