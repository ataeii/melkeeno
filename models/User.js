import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    phone: {
      type: String,
      unique: [true, 'Phone already exists'],
      required: [true, 'Phone number is required'],
      match: [/^09\d{9}$/, 'Invalid Iranian mobile number'],
    },
    username: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    image: {
      type: String,
    },
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],
    // Scraped Divar listings (token) and scraped schools (id) — these live
    // in the separate SQLite-backed scraper API, not MongoDB, so they're
    // stored as plain identifiers rather than a Property ref.
    bookmarkedListings: [{ type: String }],
    bookmarkedSchools: [{ type: Number }],
  },
  {
    timestamps: true,
  }
);

const User = models.User || model('User', UserSchema);

export default User;
