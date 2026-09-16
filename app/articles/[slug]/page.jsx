import Link from 'next/link';
import { notFound } from 'next/navigation';
import connectDB from '@/config/database';
import Article from '@/models/Article';
import ArticleComments from '@/components/ArticleComments';
import { FaArrowRight } from 'react-icons/fa';

// See app/articles/page.jsx -- without this, a status/content edit in the
// DB wouldn't show up until the next code deploy.
export const dynamic = 'force-dynamic';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

const getArticle = async (slug) => {
  await connectDB();
  const article = await Article.findOne({ slug });
  if (!article) return null;
  return JSON.parse(JSON.stringify(article));
};

// The "زبان الگو" (Pattern Language) series had zero links between entries
// -- each one was an island only reachable via the flat /articles list or
// the sitemap, with no way for a reader (or crawler) to walk the series.
// This derives prev/next from the live DB rather than baking links into
// each article's stored content, so it stays correct automatically as new
// entries are added without editing past documents.
const SERIES_SLUG_RE = /^zaban-olgo-book(\d+)-/;

const getSeriesNav = async (slug) => {
  const match = slug.match(SERIES_SLUG_RE);
  if (!match) return null;

  await connectDB();
  const entries = await Article.find({ slug: { $regex: '^zaban-olgo-book\\d+-' }, status: 'published' })
    .select('slug title')
    .lean();

  const numbered = entries
    .map((e) => ({ ...e, num: parseInt(e.slug.match(SERIES_SLUG_RE)[1], 10) }))
    .sort((a, b) => a.num - b.num);

  const currentNum = parseInt(match[1], 10);
  const index = numbered.findIndex((e) => e.num === currentNum);
  if (index === -1) return null;

  return {
    prev: index > 0 ? numbered[index - 1] : null,
    next: index < numbered.length - 1 ? numbered[index + 1] : null,
  };
};

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'مقاله یافت نشد' };

  return {
    title: `${article.title} | خانه‌داده`,
    description: article.excerpt,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: { title: article.title, description: article.excerpt, type: 'article' },
    // Drafts stay reachable by direct link for review, but must never be
    // indexed or show up in the public /articles list before someone signs
    // off on them.
    robots: { index: article.status === 'published', follow: article.status === 'published' },
  };
}

const Block = ({ block }) => {
  if (block.type === 'heading') {
    return <h2 className='text-lg font-bold text-gray-800 mt-6 mb-2'>{block.text}</h2>;
  }
  if (block.type === 'list') {
    return (
      <ul className='list-disc pr-5 space-y-1.5 text-gray-700 leading-relaxed mb-4'>
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'image') {
    return (
      <figure className='mb-4'>
        {/* Plain <img>, not next/image -- article images come from whatever
            verified external source (Wikimedia Commons, etc.) each article
            cites, not a fixed set of allow-listed domains known at build time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.url}
          alt={block.caption || ''}
          loading='lazy'
          className='w-full h-auto rounded-xl border border-gray-100'
        />
        {block.caption && (
          <figcaption className='text-xs text-gray-400 mt-1.5 text-center'>{block.caption}</figcaption>
        )}
      </figure>
    );
  }
  return <p className='text-gray-700 leading-loose mb-4'>{block.text}</p>;
};

const ArticlePage = async ({ params }) => {
  const article = await getArticle(params.slug);
  if (!article) notFound();
  const seriesNav = await getSeriesNav(article.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    articleSection: article.category,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
  };

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      {article.status === 'draft' && (
        <div className='bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2 mb-6'>
          پیش‌نویس — این مقاله هنوز منتشر نشده و در فهرست عمومی مقالات دیده نمی‌شود.
        </div>
      )}

      <Link href='/articles' className='text-blue-600 text-sm font-semibold inline-flex items-center gap-1 mb-4'>
        <FaArrowRight /> بازگشت به مقالات
      </Link>

      <div className='flex items-center gap-2 mb-3'>
        <span className='text-3xl'>{article.coverEmoji || '📄'}</span>
        <span className='text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full'>
          {article.category}
        </span>
        <span className='text-xs text-gray-400'>{formatDate(article.createdAt)}</span>
      </div>

      <h1 className='text-2xl font-extrabold text-gray-800 mb-2 leading-relaxed'>{article.title}</h1>
      {article.author && <p className='text-sm text-gray-500 mb-6'>نویسنده: {article.author}</p>}

      <div>
        {article.content.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      {seriesNav && (seriesNav.prev || seriesNav.next) && (
        <div className='mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3'>
          {seriesNav.prev ? (
            <Link
              href={`/articles/${seriesNav.prev.slug}`}
              className='bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-sm transition-colors'
            >
              <span className='text-gray-400 text-xs block mb-1'>← الگوی قبلی</span>
              <span className='text-gray-800 font-semibold line-clamp-2'>{seriesNav.prev.title}</span>
            </Link>
          ) : (
            <div />
          )}
          {seriesNav.next ? (
            <Link
              href={`/articles/${seriesNav.next.slug}`}
              className='bg-blue-50 hover:bg-blue-100 rounded-xl p-3 text-sm text-left transition-colors'
            >
              <span className='text-blue-400 text-xs block mb-1'>الگوی بعدی →</span>
              <span className='text-blue-800 font-semibold line-clamp-2'>{seriesNav.next.title}</span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}

      <ArticleComments articleSlug={article.slug} />

      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
};

export default ArticlePage;
