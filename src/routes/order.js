// src/routes/order.js
import express from 'express';
import { submitOrder, getMyOrders, getShopOrders, approveOrder, declineOrder, deleteOrder } from '../controllers/order.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner, isOrderOwner } from '../middleware/owner.js';

const router = express.Router();
router.post('/submit/:shopId', authMiddleware, submitOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/shop/:shopId', authMiddleware, isShopOwner, getShopOrders);
router.patch('/:orderId/approve', authMiddleware, isOrderOwner, approveOrder);
router.patch('/:orderId/decline', authMiddleware, isOrderOwner, declineOrder);
router.delete('/:orderId', authMiddleware, isOrderOwner, deleteOrder);

export default router;