// src/models/AuditLog.js
import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true }, // e.g., 'update'
  changes: { type: Object },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('AuditLog', auditSchema);