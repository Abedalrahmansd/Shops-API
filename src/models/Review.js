// src/models/Review.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  photo: { type: String }, // URL
}, { timestamps: true });

reviewSchema.index({ shop: 1, user: 1 }); // For getReviews queries

export default mongoose.model('Review', reviewSchema);