// src/routes/product.js
import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct, likeProduct } from '../controllers/product.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner, isProductOwner } from '../middleware/owner.js'; // Reuse for product (check shop owner)
import { upload } from '../middleware/upload.js';
import { validate, createProductSchema, updateProductSchema } from '../middleware/validate.js';

const router = express.Router();
router.post('/shops/:shopId', authMiddleware, isShopOwner, upload.array('images', 5), validate(createProductSchema), createProduct);
router.get('/shops/:shopId', getProducts);
router.post('/:productId/like', authMiddleware, likeProduct);
router.get('/:productId',authMiddleware, getProduct);
router.patch('/:productId', authMiddleware, isProductOwner, upload.array('images', 5), validate(updateProductSchema), updateProduct);
router.delete('/:productId', authMiddleware, isProductOwner, deleteProduct);

export default router;