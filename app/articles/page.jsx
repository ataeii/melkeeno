import Link from 'next/link';
import connectDB from '@/config/database';
import Article from '@/models/Article';
import ArticleCard from '@/components/ArticleCard';
import { pageMeta } from '@/lib/seo';
import { SECTIONS, sectionOf } from '@/lib/articleSections';

// Without this, Next statically renders the page at build time and caches
// whatever the DB returned then -- fine for code, wrong for content that's
// meant to change (publish/edit) without a redeploy. Same reason
// app/sitemap.js already sets this.
export const dynamic = 'force-dynamic';

export const metadata = pageMeta({
  title: 'مقالات خانه‌داده — بازار مسکن، محله‌های تهران، زبان الگو، معماری و شهرسازی',
  description:
    'مقالات خانه‌داده در چهار بخش: بازار مسکن (خرید و اجاره)، راهنمای محله‌های تهران، مجموعه‌ی «زبان الگو» و معماری و شهرسازی.',
  path: '/articles',
});

const toFa = (n) => Number(n).toLocaleString('fa-IR');

const getPublishedArticles = async () => {
  await connectDB();
  const articles = await Article.find({ status: 'published' })
    .select('title slug excerpt category coverEmoji createdAt pinned section')
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(articles));
};

// Sections come first (user's request, 2026-09-30); then pinned articles,
// then the newest articles across all sections.
const ArticlesPage = async () => {
  const articles = await getPublishedArticles();
  const bySection = Object.fromEntries(SECTIONS.map((s) => [s.key, []]));
  for (const a of articles) bySection[sectionOf(a)].push(a);
  const pinned = articles.filter((a) => a.pinned);
  const latest = articles.filter((a) => !a.pinned).slice(0, 8);

  return (
    <section dir='rtl' className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>مقالات</h1>
      <p className='text-gray-500 text-sm mb-6'>یکی از بخش‌ها را انتخاب کنید، یا تازه‌ترین مقاله‌ها را در پایین ببینید.</p>

      <div className='grid sm:grid-cols-2 gap-4 mb-10'>
        {SECTIONS.map((s) => (
          <Link
            key={s.key}
            href={s.href}
            className='bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col border-t-4 border-blue-600'
          >
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-lg font-extrabold text-gray-800'>
                <span className='ml-1'>{s.emoji}</span> {s.label}
              </h2>
              <span className='text-xs text-gray-400'>{toFa(bySection[s.key].length)} مقاله</span>
            </div>
            <p className='text-sm text-gray-500 leading-relaxed mb-3'>{s.description}</p>
            <ul className='text-xs text-gray-600 flex flex-col gap-1 mb-3'>
              {bySection[s.key].slice(0, 3).map((a) => (
                <li key={a.slug} className='line-clamp-1'>• {a.title}</li>
              ))}
            </ul>
            <span className='text-sm font-semibold text-blue-700 mt-auto'>ورود به بخش ←</span>
          </Link>
        ))}
      </div>

      {pinned.length > 0 && (
        <div className='grid sm:grid-cols-2 gap-4 mb-10'>
          {pinned.map((a) => (
            <ArticleCard key={a.slug} a={a} wide />
          ))}
        </div>
      )}

      {latest.length > 0 && (
        <>
          <h2 className='text-lg font-bold text-gray-800 mb-4'>تازه‌ترین مقاله‌ها</h2>
          <div className='grid sm:grid-cols-2 gap-4'>
            {latest.map((a) => (
              <ArticleCard key={a.slug} a={a} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ArticlesPage;
