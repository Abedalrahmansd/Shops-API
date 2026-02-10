import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  name: { type: String, required: true },
  bio: { type: String },
  avatar: { type: String }, // URL to upload
  phone: { type: String, unique: true, sparse: true }, // Optional unique
  interests: [{ type: String }], // For feed
  shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
  primaryShop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, // For deactivation
  deactivationDate: { type: Date }, // For 30-day purge
});
userSchema.index({ email: 'text', name: 'text' }); // Search
export default mongoose.model('User', userSchema);