import { Schema, model, models } from 'mongoose';

const MaterialPriceSchema = new Schema(
  {
    category: { type: String, enum: ['cement', 'rebar', 'brick', 'block', 'gypsum'], required: true },
    name: { type: String, required: true },
    spec: String, // packaging/size, e.g. "کیسه ۵۰ کیلویی"
    price: { type: Number, required: true }, // Toman; 0 means unavailable at the source
    sourceUrl: String,
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default models.MaterialPrice || model('MaterialPrice', MaterialPriceSchema);
