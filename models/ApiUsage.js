import { Schema, model, models } from 'mongoose';

// Generic daily call counter for rate-limiting external paid APIs (currently
// just Gemini). Key is "<service>:<YYYY-MM-DD>" so it naturally resets each
// day without a cron job — old rows are just never touched again.
const ApiUsageSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ApiUsage = models.ApiUsage || model('ApiUsage', ApiUsageSchema);

export default ApiUsage;
