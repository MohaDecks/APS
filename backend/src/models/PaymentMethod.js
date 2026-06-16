import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: '💳', trim: true },
    logo_url: { type: String, default: null },
    active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('PaymentMethod', paymentMethodSchema);
