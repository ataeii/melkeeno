import { Schema, model, models } from 'mongoose';

// One row per (supplier, product) -- unlike MaterialPrice (one union/market
// price per material), this holds real per-supplier listings so a category
// page can show several sellers side by side, Torob-style.
const SupplierPriceSchema = new Schema(
  {
    category: { type: String, enum: ['cement', 'rebar', 'brick', 'block', 'gypsum'], required: true },
    supplier: { type: String, required: true }, // machine key, e.g. "gachland"
    supplierName: { type: String, required: true }, // display name, e.g. "گچ‌لند"
    name: { type: String, required: true }, // product title as listed by the supplier
    spec: String,
    price: { type: Number, required: true }, // Toman
    productUrl: { type: String, required: true }, // direct link to the listing
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default models.SupplierPrice || model('SupplierPrice', SupplierPriceSchema);
