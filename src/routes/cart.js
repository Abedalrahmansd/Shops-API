// src/routes/cart.js
import express from 'express';
import { getCart, addToCart, removeItem, updateQuantity, clearCart } from '../controllers/cart.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, addToCartSchema } from '../middleware/validate.js';

const router = express.Router();

router.get('/', authMiddleware, getCart);
router.post('/add', authMiddleware, validate(addToCartSchema), addToCart);
router.patch('/:productId/quantity', authMiddleware, updateQuantity);
router.delete('/:productId', authMiddleware, removeItem);
router.delete('/', authMiddleware, clearCart);

export default router;