// src/models/Message.js (if needed)
import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Optional embed
}, { timestamps: true });
messageSchema.index({ shop: 1, createdAt: -1 }); // For history queries
export default mongoose.model('Message', messageSchema);