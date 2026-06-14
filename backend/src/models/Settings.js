import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    hourly_rate: { type: Number, default: 50 },
    facility_name: { type: String, default: 'Bole International Airport Parking' },
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
);

export default mongoose.model('Settings', settingsSchema);
