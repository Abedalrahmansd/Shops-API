import mongoose from 'mongoose';
const auditSchema = new mongoose.Schema({
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  action: String, // 'update'
  changes: Object,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
export default mongoose.model('AuditLog', auditSchema);