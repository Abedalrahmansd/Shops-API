// src/models/Notification.js
import mongoose from 'mongoose';
const notifSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['order', 'review', 'message', 'approval'] },
  content: { type: String },
  read: { type: Boolean, default: false },
  link: { type: String },
}, { timestamps: true });
notifSchema.index({ user: 1, read: 1 });
export default mongoose.model('Notification', notifSchema);