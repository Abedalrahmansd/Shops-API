// src/routes/shop.js
import express from 'express';
import { createShop, getShop, updateShop, deactivateShop, getMyShops, setPrimary, followShop, likeShop, shareShop, reportShop, verifyShop } from '../controllers/shop.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner } from '../middleware/owner.js';
import { isAdmin } from '../middleware/admin.js';
import { validate, createShopSchema, updateShopSchema, reportShopSchema, setPrimarySchema } from '../middleware/validate.js';
// import Joi from 'joi';

/* const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().optional(),
  phone: Joi.string().required(),
  uniqueId: Joi.string().optional(),
});
 */
const router = express.Router();
router.post('/', authMiddleware, validate(createShopSchema), createShop);
router.get('/my', authMiddleware, getMyShops);
router.patch('/primary', authMiddleware, validate(setPrimarySchema), setPrimary);
router.post('/:id/follow', authMiddleware, followShop);
router.post('/:id/like', authMiddleware, likeShop);
router.post('/:id/share', authMiddleware, shareShop);
router.post('/:id/report', authMiddleware, validate(reportShopSchema), reportShop);
router.patch('/:id/verify', authMiddleware, isAdmin, verifyShop);
router.get('/:id', getShop); // Public, by id or uniqueId
router.patch('/:shopId', authMiddleware, isShopOwner, validate(updateShopSchema), updateShop);
router.delete('/:shopId', authMiddleware, isShopOwner, deactivateShop);

export default router;