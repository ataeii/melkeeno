import Link from 'next/link';
import connectDB from '@/config/database';
import MaterialPrice from '@/models/MaterialPrice';
import { pageMeta } from '@/lib/seo';

// Server-rendered on purpose: this used to be a client component that fetched
// prices after load, so the HTML a crawler first saw contained no prices at
// all (~100 words) -- useless for a page about «قیمت روز». Prices are read
// straight from Mongo per request; they only change once a day.
export const dynamic = 'force-dynamic';

const CATEGORY_LABELS = {
  cement: 'سیمان',
  rebar: 'میلگرد',
  brick: 'آجر',
  block: 'بلوک',
  gypsum: 'گچ',
};

const CATEGORY_ORDER = ['cement', 'rebar', 'brick', 'block', 'gypsum'];

const SUPPLIERS = [
  { name: 'مه‌میل استور', url: 'https://mahmilstore.com' },
  { name: 'البرز مصالح', url: 'https://alborzmasaleh.com' },
  { name: 'بازار سفید', url: 'https://bazarsefid.com' },
  { name: 'مصالح مارکت', url: 'https://masalehmarket.com' },
  { name: 'مصالح کرمی', url: 'https://masalehakrami.com' },
  { name: 'گچ لند', url: 'https://gachland.com' },
  { name: 'آهن آنلاین', url: 'https://ahanonline.com' },
  { name: 'آهنگر', url: 'https://ahangar.com' },
  { name: 'فولادسل', url: 'https://fooladsell.com' },
  { name: 'آهن اینجا', url: 'https://ahaninja.com' },
];

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatPrice = (price) => (price > 0 ? `${price.toLocaleString('fa-IR')} تومان` : 'قیمت موجود نیست');

async function loadPrices() {
  try {
    await connectDB();
    const items = await MaterialPrice.find({}).sort({ category: 1, price: -1 }).lean();
    return { items: JSON.parse(JSON.stringify(items)), updatedAt: items.length ? items[0].fetchedAt : null, error: false };
  } catch (e) {
    console.log(e);
    return { items: [], updatedAt: null, error: true };
  }
}

const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

// «قیمت روز» searches expect a date: put the last update in the title.
export async function generateMetadata() {
  const { updatedAt } = await loadPrices();
  const date = shortDate(updatedAt);
  return pageMeta({
    title: `قیمت روز مصالح ساختمانی${date ? ` — ${date}` : ''}: سیمان، میلگرد، آجر، بلوک و گچ | خانه‌داده`,
    description: `قیمت امروز مصالح ساختمانی در تهران${date ? ` (به‌روزرسانی ${date})` : ''}: سیمان، میلگرد، آجر، بلوک و گچ، همراه با مقایسه‌ی قیمت فروشندگان آنلاین.`,
    path: '/materials',
  });
}

const MaterialsPage = async () => {
  const { items, updatedAt, error } = await loadPrices();
  const loading = false;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    rows: items.filter((i) => i.category === cat),
  })).filter((g) => g.rows.length > 0);

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>قیمت روز مصالح ساختمانی</h1>
      <p className='text-gray-500 text-sm mb-1'>
        سیمان، میلگرد، آجر، بلوک و گچ — بروزرسانی روزانه، بر اساس گزارش اتحادیه صنف فروشندگان مصالح ساختمانی.
      </p>
      {updatedAt && <p className='text-gray-400 text-xs mb-8'>آخرین بروزرسانی: {formatDate(updatedAt)}</p>}
      {!updatedAt && <div className='mb-8' />}

      {loading && <p className='text-gray-400 text-sm'>در حال بارگذاری...</p>}
      {error && <p className='text-red-500 text-sm'>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className='text-gray-400 text-sm'>در حال حاضر قیمتی ثبت نشده است.</p>
      )}

      <div className='space-y-6'>
        {grouped.map((g) => (
          <div key={g.category} className='bg-white rounded-xl shadow-md overflow-hidden'>
            <div className='bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between'>
              <h2 className='text-sm font-bold text-gray-800'>{g.label}</h2>
              <Link href={`/materials/${g.category}`} className='text-xs text-blue-600 hover:text-blue-700'>
                مقایسه قیمت فروشندگان ←
              </Link>
            </div>
            <div className='divide-y divide-gray-100'>
              {/* Each row links to this category's real supplier comparison,
                  not a page matched to this exact named item -- the union
                  price report's naming ("سیمان تیپ ۲ تهران") doesn't line up
                  cleanly with how suppliers list the same product, so a
                  same-item match would risk showing an unrelated product
                  under this name. Category-level is what's honestly
                  possible with the data we have. */}
              {g.rows.map((row, idx) => (
                <Link
                  key={idx}
                  href={`/materials/${g.category}`}
                  className='flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors'
                >
                  <div className='text-gray-700'>
                    <span>{row.name}</span>
                    {row.spec && <span className='text-gray-400 mr-1.5'>· {row.spec}</span>}
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className={row.price > 0 ? 'font-semibold text-gray-800' : 'text-gray-400 text-xs'}>
                      {formatPrice(row.price)}
                    </span>
                    <span className='text-gray-300 text-xs'>›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-8'>
        <h2 className='text-sm font-bold text-gray-800 mb-3'>خرید آنلاین از فروشندگان</h2>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
          {SUPPLIERS.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target='_blank'
              rel='noopener noreferrer'
              className='bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 text-center hover:border-blue-400 hover:text-blue-600 transition-colors'
            >
              {s.name}
            </a>
          ))}
        </div>
        <p className='text-gray-400 text-xs mt-2'>
          این فروشگاه‌ها توسط خانه‌داده تایید یا پشتیبانی نمی‌شوند؛ پیش از خرید، قیمت و اعتبار فروشنده را خودتان بررسی کنید.
        </p>
      </div>

      <p className='text-gray-400 text-xs mt-6'>
        منبع قیمت‌ها: قیمت مصالح ساختمانی و آهن‌آلات، فرصت امروز (price.forsatnet.ir)
      </p>
    </section>
  );
};

export default MaterialsPage;
