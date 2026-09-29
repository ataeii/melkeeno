import connectDB from '@/config/database';
import Article from '@/models/Article';

const DOMAIN = 'https://khanedade.ir';

export const dynamic = 'force-dynamic';

const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// RSS 2.0 feed of the latest published articles. Google Discover uses a
// site's feed for its "Follow" feature; each item carries its lead photo.
export async function GET() {
  await connectDB();
  const articles = await Article.find({ status: 'published' })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('slug title excerpt category createdAt content')
    .lean();

  const items = articles
    .map((a) => {
      const url = `${DOMAIN}/articles/${a.slug}`;
      const image = (a.content || []).find((b) => b.type === 'image' && b.url)?.url;
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(a.excerpt)}</description>
      <category>${esc(a.category)}</category>
      <pubDate>${new Date(a.createdAt).toUTCString()}</pubDate>${
        image ? `\n      <media:content url="${esc(image)}" medium="image" />` : ''
      }
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>مقالات خانه‌داده</title>
    <link>${DOMAIN}/articles</link>
    <atom:link href="${DOMAIN}/feed.xml" rel="self" type="application/rss+xml" />
    <description>راهنمای خرید، اجاره و بازار مسکن تهران، راهنمای محله‌ها و مقالات معماری و شهرسازی</description>
    <language>fa</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900',
    },
  });
}
