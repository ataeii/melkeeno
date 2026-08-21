import { Schema, model, models } from 'mongoose';

// Schools live in the separate scraper's SQLite DB (results.db), not Mongo
// -- schoolId is that plain integer id, not a Mongo ObjectId reference.
// schoolName is denormalized so a review is still readable even if that
// school ever drops out of the scraped dataset.
const SchoolReviewSchema = new Schema(
  {
    schoolId: { type: Number, required: true },
    schoolName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    // Auto-visible for now -- there's no admin moderation queue/UI built
    // yet, and with essentially zero traffic to start, spam risk is low.
    // The field exists so a moderation step can be added later without a
    // schema change if that becomes necessary.
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  },
  { timestamps: true }
);

SchoolReviewSchema.index({ schoolId: 1, createdAt: -1 });

export default models.SchoolReview || model('SchoolReview', SchoolReviewSchema);
