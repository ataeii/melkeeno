import { Schema, model, models } from 'mongoose';

const OtpCodeSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      match: [/^09\d{9}$/, 'Invalid Iranian mobile number'],
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpCode = models.OtpCode || model('OtpCode', OtpCodeSchema);

export default OtpCode;
