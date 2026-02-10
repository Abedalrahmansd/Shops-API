import mongoose from 'mongoose';
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    addedAt: { type: Date, default: Date.now },
  }],
});
export default mongoose.model('Cart', cartSchema);