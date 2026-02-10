import mongoose from 'mongoose';
const productSchema = new mongoose.Schema({
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' }, // 'USD', 'LBP', custom
  images: [{ type: String }], // URLs
  stock: { type: Number, default: 0 },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }], // Array of user IDs who viewed
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }], // Array of user IDs
});
productSchema.index({ title: 'text', description: 'text' });
export default mongoose.model('Product', productSchema);