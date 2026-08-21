import { Schema, model, models } from 'mongoose';

// content is structured blocks rather than raw HTML/markdown -- no markdown
// renderer is in this project's dependencies yet, and structured blocks are
// simple to render safely (no dangerouslySetInnerHTML) with plain JSX.
const BlockSchema = new Schema(
  {
    type: { type: String, enum: ['heading', 'paragraph', 'list', 'image'], required: true },
    text: String, // heading | paragraph
    items: [String], // list
    url: String, // image -- only ever a stable, verifiably-licensed source (Wikimedia
    // Commons public-domain/CC files), never hotlinked from a random site or copied
    // from a copyrighted stock/news photo. See caption for required attribution.
    caption: String, // image -- shown under the image; carries CC attribution text when required by the license
  },
  { _id: false }
);

const ArticleSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    category: { type: String, required: true }, // matches ARTICLE_CATEGORIES in app/articles/page.jsx
    coverEmoji: String, // no image pipeline for this content yet -- a large emoji as a lightweight placeholder cover
    author: String, // byline -- optional; most articles are unsigned site content, only shown when set
    content: { type: [BlockSchema], required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true }
);

export default models.Article || model('Article', ArticleSchema);
