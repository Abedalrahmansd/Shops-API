// src/models/Report.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['shop', 'product', 'user', 'review'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
}, { timestamps: true });

reportSchema.index({ targetType: 1, targetId: 1, status: 1 }); // For getReports

export default mongoose.model('Report', reportSchema);