// src/routes/order.js
import express from 'express';
import { submitOrder, getMyOrders, getShopOrders, getOrder, approveOrder, declineOrder, deleteOrder } from '../controllers/order.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner } from '../middleware/owner.js';

const router = express.Router();

router.post('/submit/:shopId', authMiddleware, submitOrder);
router.get('/', authMiddleware, getMyOrders);
router.get('/:orderId', authMiddleware, getOrder);
router.get('/shop/:shopId', authMiddleware, isShopOwner, getShopOrders);
router.patch('/:orderId/approve', authMiddleware, isShopOwner, approveOrder);
router.patch('/:orderId/decline', authMiddleware, isShopOwner, declineOrder);
router.delete('/:orderId', authMiddleware, deleteOrder);

export default router;