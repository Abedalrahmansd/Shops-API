import mongoose from 'mongoose';
const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, enum: ['shop', 'product', 'user'] },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
});
export default mongoose.model('Report', reportSchema);