import mongoose from 'mongoose';
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, price: Number, currency: String }],
  total: { type: Number },
  currency: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('Order', orderSchema);