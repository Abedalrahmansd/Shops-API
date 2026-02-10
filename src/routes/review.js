// src/routes/review.js
import express from 'express';
import { createReview, getReviews, deleteReview, reportReview } from '../controllers/review.js';
import { authMiddleware } from '../middleware/auth.js';
import { isShopOwner, isReviewOwner } from '../middleware/owner.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.post('/shops/:shopId', authMiddleware, upload.single('photo'), createReview);
router.get('/shops/:shopId', getReviews); // Public-ish, but add auth if needed
router.delete('/:reviewId', authMiddleware, isReviewOwner, deleteReview);
router.post('/:reviewId/report', authMiddleware, reportReview);

export default router;