// src/routes/product.js
import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct, likeProduct } from '../controllers/product.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner, isProductOwner } from '../middleware/owner.js'; // Reuse for product (check shop owner)
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.post('/shops/:shopId', authMiddleware, isShopOwner, upload.array('images', 5), createProduct);
router.get('/shops/:shopId', authMiddleware, getProducts);
router.post('/:productId/like', authMiddleware, likeProduct);
router.get('/:productId',authMiddleware, getProduct);
router.patch('/:productId', authMiddleware, isProductOwner, upload.array('images', 5), updateProduct);
router.delete('/:productId', authMiddleware, isProductOwner, deleteProduct);

export default router;