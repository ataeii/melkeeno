import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import connectDB from '@/config/database';
import Article from '@/models/Article';
import ArticleCard from '@/components/ArticleCard';
import { pageMeta } from '@/lib/seo';
import { SECTIONS, sectionByKey, sectionOf, tagLabel } from '@/lib/articleSections';

export const dynamic = 'force-dynamic';

const toFa = (n) => Number(n).toLocaleString('fa-IR');

export function generateMetadata({ params }) {
  const section = sectionByKey(params.key);
  if (!section) return { title: 'بخش یافت نشد | خانه‌داده' };
  return pageMeta({
    title: `${section.label} — مقالات خانه‌داده`,
    description: section.description,
    path: `/articles/section/${section.key}`,
  });
}

// One section of /articles. Pinned articles first, then newest first; the
// finer `category` tags inside the section (e.g. خرید / اجاره / اخبار in
// بازار مسکن) are offered as filters via ?tag=.
const SectionPage = async ({ params, searchParams }) => {
  const section = sectionByKey(params.key);
  if (!section) notFound();
  // The pattern-language series has its own, richer hub page.
  if (section.key === 'pattern-language') redirect(section.href);

  await connectDB();
  const all = JSON.parse(
    JSON.stringify(
      await Article.find({ status: 'published' })
        .select('title slug excerpt category coverEmoji createdAt pinned section')
        .sort({ pinned: -1, createdAt: -1 })
        .lean()
    )
  ).filter((a) => sectionOf(a) === section.key);

  const tags = [...new Set(all.map((a) => a.category).filter(Boolean))];
  const tag = tags.includes(searchParams?.tag) ? searchParams.tag : null;
  const shown = tag ? all.filter((a) => a.category === tag) : all;

  return (
    <section dir='rtl' className='max-w-4xl mx-auto px-4 py-8'>
      <Link href='/articles' className='text-blue-600 text-sm font-semibold mb-4 inline-block'>
        → همه‌ی بخش‌های مقالات
      </Link>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>
        <span className='ml-1'>{section.emoji}</span> {section.label}
      </h1>
      <p className='text-gray-500 text-sm mb-5'>{section.description}</p>

      {tags.length > 1 && (
        <div className='flex flex-wrap gap-2 mb-6'>
          <Link
            href={`/articles/section/${section.key}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${!tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            همه ({toFa(all.length)})
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/articles/section/${section.key}?tag=${encodeURIComponent(t)}`}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${tag === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {tagLabel(t)} ({toFa(all.filter((a) => a.category === t).length)})
            </Link>
          ))}
        </div>
      )}

      <div className='grid sm:grid-cols-2 gap-4'>
        {shown.map((a) => (
          <ArticleCard key={a.slug} a={a} />
        ))}
      </div>

      <div className='mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-3 text-sm'>
        <span className='text-gray-400'>بخش‌های دیگر:</span>
        {SECTIONS.filter((s) => s.key !== section.key).map((s) => (
          <Link key={s.key} href={s.href} className='text-blue-700 font-semibold hover:underline'>
            {s.emoji} {s.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SectionPage;
