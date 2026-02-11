// src/controllers/review.js
import Review from '../models/Review.js';
import Shop from '../models/Shop.js';
import Report from '../models/Report.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { shopId } = req.params;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  const shop = await Shop.findById(shopId);
  if (!shop) return res.status(404).json({ message: 'Shop not found' });

  // Check if user already reviewed this shop
  const existing = await Review.findOne({ shop: shopId, user: req.user.id });
  if (existing) {
    return res.status(400).json({ message: 'You already reviewed this shop' });
  }

  const photo = req.file ? `/uploads/reviews/${req.file.filename}` : null;

  const review = new Review({
    shop: shopId,
    user: req.user.id,
    rating,
    comment: comment || '',
    photo,
  });
  await review.save();
  await review.populate('user', 'name avatar');

  // Update shop average rating
  const reviews = await Review.find({ shop: shopId });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  shop.rating = avgRating;
  shop.ratingCount = reviews.length;
  await shop.save();

  res.status(201).json({ success: true, review });
});

export const getReviews = asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const { page = 1, limit = 10, all = false } = req.query;

  const skip = all ? 0 : (parseInt(page) - 1) * parseInt(limit);
  const limit_int = all ? undefined : parseInt(limit);

  const reviews = await Review.find({ shop: shopId })
    .populate('user', 'name avatar')
    .skip(skip)
    .limit(limit_int)
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments({ shop: shopId });

  res.json({ 
    success: true, 
    reviews, 
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user.id })
    .populate('shop', 'title')
    .sort({ createdAt: -1 });

  res.json({ success: true, reviews });
});

export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (review.user.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  if (rating) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  // Recalc shop rating
  const reviews = await Review.find({ shop: review.shop });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  const shop = await Shop.findById(review.shop);
  shop.rating = avgRating;
  shop.ratingCount = reviews.length;
  await shop.save();

  res.json({ success: true, review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (review.user.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const shopId = review.shop;
  await Review.findByIdAndDelete(reviewId);

  // Recalc shop rating
  const reviews = await Review.find({ shop: shopId });
  const avgRating = reviews.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const shop = await Shop.findById(shopId);
  shop.rating = avgRating;
  shop.ratingCount = reviews.length;
  await shop.save();

  res.json({ success: true, message: 'Review deleted' });
});

export const reportReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason } = req.body;

  if (!reason || reason.length < 10) {
    return res.status(400).json({ message: 'Reason must be at least 10 characters' });
  }

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  const report = new Report({
    reporter: req.user.id,
    targetType: 'review',
    targetId: reviewId,
    reason,
  });
  await report.save();

  res.json({ success: true, message: 'Review reported successfully' });
});