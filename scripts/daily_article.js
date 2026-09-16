// Runs daily via server crontab (NOT the Next.js app, NOT a cloud routine --
// see git history/conversation: the cloud routine approach silently did
// nothing for 5 days straight with no visible error, so this replaced it
// with something that logs to a real file we can actually read).
//
// Usage: cd /var/www/melkeeno && node scripts/daily_article.js
// Logs everything to stdout -- crontab redirects this to a log file.
'use strict';
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv(file) {
  const content = fs.readFileSync(file, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(__dirname, '..', '.env.production'));

const BlockSchema = new mongoose.Schema(
  { type: String, text: String, items: [String] },
  { _id: false }
);
const ArticleSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    excerpt: String,
    category: String,
    coverEmoji: String,
    content: [BlockSchema],
    status: { type: String, default: 'draft' },
  },
  { timestamps: true }
);
const Article = mongoose.models.Article || mongoose.model('Article', ArticleSchema);

// Mirrors lib/relay.js's format exactly -- see cloudflare-worker/relay.js's
// forwardGemini() for the receiving side.
async function callGemini(prompt) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  let res;
  if (process.env.RELAY_URL) {
    res = await fetch(process.env.RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-relay-secret': process.env.RELAY_SECRET },
      body: JSON.stringify({ service: 'gemini', prompt, model }),
    });
  } else {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85 },
        }),
      }
    );
  }
  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    throw new Error('Gemini returned no text (possibly blocked by safety filters): ' + JSON.stringify(data));
  }
  return text;
}

function extractJson(text) {
  // Gemini sometimes wraps JSON in ```json fences despite instructions not to.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

function buildPrompt(existingTitles) {
  return `تو یک نویسنده‌ی محتوای املاک برای وب‌سایت خانه‌داده (khanedade.ir) هستی، یک پلتفرم جستجوی ملک در تهران.

یک مقاله‌ی کاملاً اصیل و تازه درباره‌ی خرید، اجاره، یا مسائل حقوقی/مالی ملک در ایران بنویس -- موضوعی که در لیست زیر تکراری نباشد.

مقالات قبلاً منتشرشده (این موضوعات را تکرار نکن):
${existingTitles.map((t) => '- ' + t).join('\n')}

قوانین سخت‌گیرانه:
- متن باید کاملاً با کلمات خودت نوشته شود -- هرگز از هیچ وب‌سایتی متن کپی یا نزدیک به عین آن پارافریز نکن.
- هیچ عدد دقیقی که از صحتش مطمئن نیستی اختراع نکن (نرخ سود وام خاص، درصد مالیات خاص، شماره‌ی ماده‌ی قانونی خاص) -- به‌جایش از عباراتی مثل «معمولاً» یا «طبق عرف رایج» استفاده کن، مگر یک قرارداد شناخته‌شده و کم‌تغییر باشد (مثل نرخ تبدیل رهن به اجاره حدود ۳ درصد در ماه).
- لحن: عملی، مستقیم، آموزنده -- مشابه لحن مقالات موجود سایت.
- طول: ۸ تا ۱۴ بلوک محتوا (ترکیبی از heading و paragraph و گاهی list)، حدود ۷۰۰ تا ۱۰۰۰ کلمه.

خروجی را فقط و فقط به‌صورت یک آبجکت JSON معتبر برگردان، بدون هیچ متن اضافه قبل یا بعد از آن و بدون code fence، دقیقاً با این ساختار:

{
  "title": "عنوان فارسی مقاله",
  "slug": "latin-hyphenated-slug-based-on-meaning-not-literal-transliteration",
  "excerpt": "خلاصه یک تا دو جمله‌ای",
  "category": "یکی از: راهنمای خرید | اجاره | حقوقی | دکوراسیون",
  "coverEmoji": "یک ایموجی مرتبط",
  "content": [
    {"type": "paragraph", "text": "..."},
    {"type": "heading", "text": "..."},
    {"type": "paragraph", "text": "..."},
    {"type": "list", "items": ["...", "..."]}
  ]
}`;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not found in .env.production');
  console.log(`[${new Date().toISOString()}] starting daily article job`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected to MongoDB');

  const existing = await Article.find({}).select('title slug');
  console.log(`found ${existing.length} existing articles`);

  const prompt = buildPrompt(existing.map((a) => a.title));
  console.log('calling Gemini...');
  const raw = await callGemini(prompt);

  let article;
  try {
    article = extractJson(raw);
  } catch (e) {
    console.error('Failed to parse Gemini output as JSON. Raw output was:');
    console.error(raw);
    throw e;
  }

  if (!article.title || !article.slug || !Array.isArray(article.content) || article.content.length === 0) {
    console.error('Parsed JSON is missing required fields:', article);
    throw new Error('Gemini output did not match expected article shape');
  }

  const existingSlugs = new Set(existing.map((a) => a.slug));
  if (existingSlugs.has(article.slug)) {
    article.slug = `${article.slug}-${Date.now().toString(36)}`;
    console.log(`slug collision, using "${article.slug}" instead`);
  }

  article.status = 'published';
  const saved = await Article.findOneAndUpdate({ slug: article.slug }, article, {
    upsert: true,
    new: true,
  });

  console.log(`SUCCESS: published "${saved.title}" (${saved.slug})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  console.error(err.stack);
  process.exitCode = 1;
});
