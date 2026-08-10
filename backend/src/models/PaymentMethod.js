import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, default: 'Ethiopia' },
    city_name: { type: String, default: '' },
    merchantUid: { type: String, default: '' },
    apiKey: { type: String, default: '' },
    apiUserId: { type: String, default: '' },
    prefix: { type: String, default: '' },
    merchant_prefix: { type: String, default: '' },
    is_visible: { type: Number, default: 1 },
    is_ussd: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
    image_url: { type: [String], default: [] },
    /** Legacy / operator UI fields */
    icon: { type: String, default: '💳', trim: true },
    logo_url: { type: String, default: null },
    active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('PaymentMethod', paymentMethodSchema);
