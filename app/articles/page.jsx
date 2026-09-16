import Link from 'next/link';
import connectDB from '@/config/database';
import Article from '@/models/Article';

// Without this, Next statically renders the page at build time and caches
// whatever the DB returned then -- fine for code, wrong for content that's
// meant to change (publish/edit) without a redeploy. Same reason
// app/sitemap.js already sets this.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'مقالات ملکی | خانه‌داده',
  description: 'راهنمای خرید، اجاره و مسائل حقوقی ملک در ایران — نکات کاربردی برای تصمیم‌های ملکی بهتر.',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

const getPublishedArticles = async () => {
  await connectDB();
  const articles = await Article.find({ status: 'published' })
    .select('title slug excerpt category coverEmoji createdAt')
    .sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(articles));
};

const ArticlesPage = async () => {
  const articles = await getPublishedArticles();

  return (
    <section dir='rtl' className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>مقالات ملکی</h1>
      <p className='text-gray-500 text-sm mb-8'>
        راهنمای خرید، اجاره و مسائل حقوقی ملک — نکات کاربردی برای تصمیم‌های ملکی بهتر.
      </p>

      {articles.length === 0 ? (
        <p className='text-gray-400 text-center py-16'>هنوز مقاله‌ای منتشر نشده است.</p>
      ) : (
        <div className='grid sm:grid-cols-2 gap-4'>
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              className='bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col'
            >
              <div className='flex items-center gap-2 mb-2'>
                <span className='text-2xl'>{a.coverEmoji || '📄'}</span>
                <span className='text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full'>
                  {a.category}
                </span>
              </div>
              <h2 className='font-bold text-gray-800 mb-1 leading-relaxed'>{a.title}</h2>
              <p className='text-gray-500 text-sm leading-relaxed line-clamp-3 mb-2'>{a.excerpt}</p>
              <span className='text-[11px] text-gray-400 mt-auto'>{formatDate(a.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default ArticlesPage;
