import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'operator'], required: true },
    /** Admin only: can add/edit/delete payment methods */
    can_update_payments: { type: Boolean, default: false },
    /** Admin only: can change hourly rate / pricing */
    can_update_price: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export default mongoose.model('User', userSchema);
