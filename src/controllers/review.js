// src/controllers/review.js
import Review from '../models/Review.js';
import Shop from '../models/Shop.js';
import Report from '../models/Report.js';

export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const photo = req.file ? `/uploads/reviews/${req.file.filename}` : null;

  const review = new Review({
    shop: req.params.shopId,
    user: req.user.id,
    rating,
    comment,
    photo,
  });
  await review.save();

  // Update shop average rating
  const shop = await Shop.findById(req.params.shopId);
  const reviews = await Review.find({ shop: shop._id });
  shop.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  shop.ratingCount = reviews.length;
  await shop.save();

  res.status(201).json({ success: true, review });
};

export const getReviews = async (req, res) => {
  const { page = 1, limit = 10, all = false } = req.query;
  const reviews = await Review.find({ shop: req.params.shopId })
    .populate('user', 'name avatar')
    .skip(all ? 0 : (page - 1) * limit)
    .limit(all ? Infinity : parseInt(limit));
  res.json({ success: true, reviews });
};

export const deleteReview = async (req, res) => {
  await Review.findByIdAndDelete(req.params.reviewId);
  // Recalc shop rating (similar to create)
  const shop = await Shop.findById(req.params.shopId); // Assume shopId from req or fetch from review
  const reviews = await Review.find({ shop: shop._id });
  shop.rating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
  shop.ratingCount = reviews.length;
  await shop.save();
  res.json({ success: true });
};

export const reportReview = async (req, res) => {
  const { reason } = req.body;
  const report = new Report({
    reporter: req.user.id,
    targetType: 'review',
    targetId: req.params.reviewId,
    reason,
  });
  await report.save();
  res.json({ success: true, message: 'Review reported' });
};