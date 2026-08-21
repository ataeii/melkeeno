import { Schema, model, models } from 'mongoose';

const ArticleCommentSchema = new Schema(
  {
    articleSlug: { type: String, required: true },
    // Present only when the commenter was logged in -- anonymous comments
    // (explicitly requested: viewers can comment "either logged in or
    // anonymously") leave this unset.
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, required: true }, // real name if logged in, else whatever the anonymous commenter typed (or "ناشناس")
    comment: { type: String, required: true },
    // Auto-visible for now, same call as SchoolReview -- no moderation
    // queue/UI exists yet. Worth revisiting sooner here than for school
    // reviews, since anonymous posting (no auth gate at all) is more
    // exposed to spam; the field exists so a moderation step can be added
    // later without a schema change.
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  },
  { timestamps: true }
);

ArticleCommentSchema.index({ articleSlug: 1, createdAt: -1 });

export default models.ArticleComment || model('ArticleComment', ArticleCommentSchema);
