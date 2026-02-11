// src/routes/review.js
import express from 'express';
import { createReview, getReviews, getMyReviews, updateReview, deleteReview, reportReview } from '../controllers/review.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate, createReviewSchema, reportReviewSchema } from '../middleware/validate.js';

const router = express.Router();

router.post('/:shopId', authMiddleware, upload.single('photo'), validate(createReviewSchema), createReview);
router.get('/', authMiddleware, getMyReviews);
router.get('/:shopId', getReviews); // Public
router.patch('/:reviewId', authMiddleware, updateReview);
router.delete('/:reviewId', authMiddleware, deleteReview);
router.post('/:reviewId/report', authMiddleware, validate(reportReviewSchema), reportReview);

export default router;