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

export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'مقاله یافت نشد' };

  return {
    title: `${article.title} | ملکینو`,
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

      <ArticleComments articleSlug={article.slug} />

      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
};

export default ArticlePage;
