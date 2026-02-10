import mongoose from 'mongoose';
const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  uniqueId: { type: String, unique: true }, // User-set or auto
  category: { type: String }, // e.g., 'food'
  phone: { type: String, required: true }, // For WhatsApp
  customization: { type: Object }, // JSON: {template: '1', colors: {...}, layout: [...]}
  icon: { type: Object }, // JSON: {shape: 'circle', color: '#FF0000', overlay: 'roof1'}
  sections: [{ name: String, products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] }], // Custom groups
  rating: { type: Number, default: 0 }, // Average
  ratingCount: { type: Number, default: 0 },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who viewed
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked
  shares: { type: Number, default: 0 }, // Keep shares as counter
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false }, // Admin
  messageTemplate: { type: String, default: 'السلام عليكم\n%%products%%\nالاجمالي: {{total}}\n' }, // Customizable
  isActive: { type: Boolean, default: true },
});
shopSchema.index({ title: 'text', description: 'text', tags: 'text', uniqueId: 1, owner: 1 });
export default mongoose.model('Shop', shopSchema);