import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  photo: { type: String }, // URL
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('Review', reviewSchema);