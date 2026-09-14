import { Schema, model, models } from 'mongoose';

const OfficeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    phone: { type: String, required: true },
    description: String,
    workingHours: String,
    specialties: [{ type: String, enum: ['buy', 'rent', 'commercial', 'residential'] }],
    logoUrl: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export default models.Office || model('Office', OfficeSchema);
