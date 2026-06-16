import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    plate: { type: String, required: true, uppercase: true },
    entry_time: { type: Date, required: true },
    exit_time: { type: Date },
    fee: { type: Number },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    checked_in_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checked_out_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payment_method_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod' },
    payment_method_name: { type: String },
    payment_method_icon: { type: String },
    payment_method_logo_url: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

sessionSchema.index({ plate: 1, status: 1 });
sessionSchema.index({ status: 1, exit_time: -1 });

export default mongoose.model('Session', sessionSchema);
