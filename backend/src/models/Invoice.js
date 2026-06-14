import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    invoice_number: { type: String, required: true, unique: true },
    plate: { type: String, required: true },
    entry_time: { type: Date, required: true },
    exit_time: { type: Date, required: true },
    duration_minutes: { type: Number, required: true },
    hourly_rate: { type: Number, required: true },
    total_fee: { type: Number, required: true },
    facility_name: { type: String, required: true },
    issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

invoiceSchema.index({ plate: 1, created_at: -1 });

export default mongoose.model('Invoice', invoiceSchema);
