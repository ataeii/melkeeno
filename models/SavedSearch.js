import { Schema, model, models } from 'mongoose';

// A Telegram user's "follow this search" subscription, created from the
// existing /search bot flow (district + rooms) in
// app/api/telegram/webhook/route.js. `notifiedTokens` tracks which
// listings have already been sent so the dispatch script (see
// scripts/send_saved_search_alerts.js) only ever alerts on genuinely new
// matches -- necessary because a listing's scraped_at gets bumped on every
// re-scrape even when it isn't new, so token-based dedup is the only
// reliable signal, not a date comparison.
const SavedSearchSchema = new Schema(
  {
    chatId: { type: String, required: true },
    listingType: { type: String, default: 'buy' },
    district: String, // exact scraper district string, or null for "همه مناطق"
    districtLabel: { type: String, required: true }, // display label shown back to the user
    rooms: Number, // exact room count, or null
    minRooms: Number, // "3+ خواب" case
    notifiedTokens: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.SavedSearch || model('SavedSearch', SavedSearchSchema);
