import Link from 'next/link';
import connectDB from '@/config/database';
import Article from '@/models/Article';
import AuthorBox from '@/components/AuthorBox';
import { pageMeta } from '@/lib/seo';
import { authorPerson } from '@/lib/authors';

// Hub page for the «زبان الگو» series: what the book is, how the series is
// written, a link to the introduction article, and every entry in book
// order. (The author's dedication lives only in the introduction article.) Built
// from the DB on each request so new entries appear here automatically,
// same as the prev/next navigation on the article pages.
export const dynamic = 'force-dynamic';

const DOMAIN = 'https://khanedade.ir';
const BOOK_RE = /^zaban-olgo-book(\d+)-/;
const toFa = (n) => Number(n).toLocaleString('fa-IR');

export const metadata = pageMeta({
  title: 'مجموعه‌ی «زبان الگو» — کتاب کریستوفر الکساندر، الگو به الگو برای تهران | خانه‌داده',
  description:
    'مرور الگو به الگوی کتاب «زبان الگو» (A Pattern Language) نوشته‌ی کریستوفر الکساندر و همکاران، هر الگو با نگاهی به تهران و ایران، نقض آن در حومه‌ی آمریکایی و یک نمونه‌ی زنده در جهان — نوشته‌ی هادی عطایی.',
  path: '/articles/zaban-olgo',
});

async function getSeries() {
  await connectDB();
  const rows = await Article.find({ slug: { $regex: '^zaban-olgo' }, status: 'published' })
    .select('slug title excerpt createdAt')
    .lean();
  const book = rows
    .filter((a) => BOOK_RE.test(a.slug))
    .map((a) => ({ ...a, num: parseInt(a.slug.match(BOOK_RE)[1], 10) }))
    .sort((a, b) => a.num - b.num);
  const early = rows.filter((a) => !BOOK_RE.test(a.slug)).sort((a, b) => a.slug.localeCompare(b.slug));
  return { book, early };
}

const SeriesPage = async () => {
  const { book: all, early } = await getSeries();
  // "book0" is the series introduction -- linked separately above the list.
  const intro = all.find((a) => a.num === 0);
  const book = all.filter((a) => a.num > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'مجموعه‌ی «زبان الگو»',
    url: `${DOMAIN}/articles/zaban-olgo`,
    author: authorPerson('هادی عطایی', DOMAIN),
    about: {
      '@type': 'Book',
      name: 'A Pattern Language',
      author: [
        { '@type': 'Person', name: 'Christopher Alexander' },
        { '@type': 'Person', name: 'Sara Ishikawa' },
        { '@type': 'Person', name: 'Murray Silverstein' },
      ],
      datePublished: '1977',
    },
    hasPart: book.map((a) => ({ '@type': 'Article', headline: a.title, url: `${DOMAIN}/articles/${a.slug}` })),
  };

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href='/articles' className='text-blue-600 text-sm font-semibold mb-4 inline-block'>
        → همه‌ی مقالات
      </Link>

      <h1 className='text-2xl font-extrabold text-gray-800 mb-4 leading-relaxed'>مجموعه‌ی «زبان الگو»</h1>

      {intro && (
        <Link
          href={`/articles/${intro.slug}`}
          className='block bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-4 mb-6 transition-colors'
        >
          <span className='block text-xs font-bold text-amber-700 mb-1'>از این‌جا شروع کنید: مقدمه‌ی مجموعه</span>
          <span className='block font-semibold text-gray-800 leading-7'>{intro.title}</span>
        </Link>
      )}

      <div className='text-gray-700 leading-8 flex flex-col gap-3 mb-8'>
        <p>
          «زبان الگو» (A Pattern Language) کتابی است که کریستوفر الکساندر همراه با سارا ایشیکاوا، ماری سیلوراستاین و
          همکارانشان در سال ۱۹۷۷ منتشر کردند: ۲۵۳ «الگو» برای ساختن شهر و خانه، از مقیاس منطقه و شهر تا محله، خیابان،
          ساختمان و جزئیات یک اتاق. هر الگو مسئله‌ای تکرارشونده را توصیف می‌کند و راه‌حلی را پیشنهاد می‌دهد که
          بارها و در فرهنگ‌های گوناگون جواب داده است.
        </p>
        <p>
          در این مجموعه، الگوها را به ترتیب کتاب مرور می‌کنیم و هر کدام را از چند زاویه می‌بینیم: ریشه‌ی آن در
          شهرسازی سنتی ایران، وضعیت امروزش در تهران، این‌که حومه‌ی آمریکایی چگونه دقیقاً برعکس آن عمل کرده، و یک
          نمونه‌ی زنده و امروزی در جای دیگری از جهان که آن را رعایت می‌کند.
        </p>
      </div>

      <h2 className='text-lg font-bold text-gray-800 mb-3'>الگوها به ترتیب کتاب</h2>
      <ol className='flex flex-col gap-2 mb-8'>
        {book.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/articles/${a.slug}`}
              className='flex gap-3 items-start bg-white hover:bg-gray-50 rounded-xl border border-gray-100 p-3 transition-colors'
            >
              <span className='text-blue-700 font-extrabold w-8 shrink-0 text-center'>{toFa(a.num)}</span>
              <span>
                <span className='block font-semibold text-gray-800 leading-7'>{a.title}</span>
                <span className='block text-xs text-gray-500 leading-6 line-clamp-2'>{a.excerpt}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {early.length > 0 && (
        <>
          <h2 className='text-lg font-bold text-gray-800 mb-1'>نوشته‌های آغازین</h2>
          <p className='text-xs text-gray-500 mb-3'>
            چند نوشته‌ی نخست مجموعه، پیش از آن‌که مرور الگوها را به ترتیب کتاب شروع کنیم.
          </p>
          <ul className='flex flex-col gap-1.5 mb-8'>
            {early.map((a) => (
              <li key={a.slug}>
                <Link href={`/articles/${a.slug}`} className='text-sm text-blue-700 hover:underline'>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <AuthorBox name='هادی عطایی' hideSeriesLink />
    </section>
  );
};

export default SeriesPage;
