// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', optional: true }, // For sharing
}, { timestamps: true });
export default mongoose.model('Message', messageSchema);