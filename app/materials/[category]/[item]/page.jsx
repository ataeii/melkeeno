import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchMaterialItem } from '@/lib/api';
import { pageMeta } from '@/lib/seo';
import { MATERIAL_LABELS, toman, faDate, PRICE_KIND, itemPath, decodeParam } from '@/lib/materials';

export const revalidate = 600;
const DOMAIN = 'https://khanedade.ir';

export async function generateMetadata({ params }) {
  const key = decodeParam(params.item);
  const item = await fetchMaterialItem(params.category, key).catch(() => null);
  if (!item) return { title: 'کالا یافت نشد | خانه‌داده' };
  const sellers = item.n_sellers.toLocaleString('fa-IR');
  return pageMeta({
    title: `قیمت ${item.label} — مقایسه ${sellers} فروشنده | خانه‌داده`,
    description: `ارزان‌ترین قیمت ${item.label}: ${toman(item.best_price)} از ${item.best_seller}. قیمت ${sellers} فروشنده‌ی آنلاین کنار هم برای مقایسه، با لینک مستقیم به هر فروشنده.`,
    path: itemPath(params.category, key),
  });
}

// Small inline sparkline of the cheapest price per day (only once there are a few days of data).
const Sparkline = ({ history }) => {
  const pts = (history || []).filter((h) => h.min_price > 0);
  if (pts.length < 3) return null;
  const w = 280;
  const h = 48;
  const min = Math.min(...pts.map((p) => p.min_price));
  const max = Math.max(...pts.map((p) => p.min_price));
  const span = max - min || 1;
  const d = pts
    .map((p, i) => `${(i / (pts.length - 1)) * w},${h - 4 - ((p.min_price - min) / span) * (h - 8)}`)
    .join(' ');
  return (
    <div className='mt-4'>
      <div className='text-xs text-gray-400 mb-1'>روند کمترین قیمت ({pts.length.toLocaleString('fa-IR')} روز اخیر)</div>
      <svg viewBox={`0 0 ${w} ${h}`} className='w-full max-w-[320px] h-12' role='img' aria-label='نمودار روند کمترین قیمت'>
        <polyline points={d} fill='none' stroke='#B9873C' strokeWidth='2' strokeLinejoin='round' strokeLinecap='round' />
      </svg>
      <div className='text-[11px] text-gray-400'>
        از {toman(pts[0].min_price)} به {toman(pts[pts.length - 1].min_price)}
      </div>
    </div>
  );
};

const MaterialItemPage = async ({ params }) => {
  const category = params.category;
  const label = MATERIAL_LABELS[category];
  if (!label) notFound();
  const key = decodeParam(params.item);
  const item = await fetchMaterialItem(category, key).catch(() => null);
  if (!item) notFound();

  const normal = item.offers.filter((o) => !o.outlier);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.label,
    category: label,
    url: `${DOMAIN}${itemPath(category, key)}`,
    offers: {
      '@type': 'AggregateOffer',
      // schema.org wants ISO 4217; Toman prices are expressed in Rial (x10).
      priceCurrency: 'IRR',
      lowPrice: item.min_price * 10,
      highPrice: item.max_price * 10,
      offerCount: normal.length || item.n_offers,
    },
  };

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href={`/materials/${category}`} className='text-blue-600 text-sm mb-4 inline-block'>
        ← همه‌ی کالاهای {label}
      </Link>

      <h1 className='text-xl font-extrabold text-gray-800 mb-1'>قیمت {item.label}</h1>
      <p className='text-gray-500 text-sm mb-4'>
        قیمت هر {item.unit_label} از {item.n_sellers.toLocaleString('fa-IR')} فروشنده — آخرین بروزرسانی: {faDate(item.updated_at)}
      </p>

      <div className='grid grid-cols-3 gap-2 mb-5 text-center'>
        <div className='bg-white rounded-xl shadow-md p-3'>
          <div className='text-[11px] text-gray-400'>کمترین قیمت</div>
          <div className='font-bold text-green-700 text-sm mt-1'>{toman(item.best_price)}</div>
        </div>
        <div className='bg-white rounded-xl shadow-md p-3'>
          <div className='text-[11px] text-gray-400'>قیمت میانه</div>
          <div className='font-bold text-gray-800 text-sm mt-1'>{toman(item.median_price)}</div>
        </div>
        <div className='bg-white rounded-xl shadow-md p-3'>
          <div className='text-[11px] text-gray-400'>بیشترین قیمت</div>
          <div className='font-bold text-gray-800 text-sm mt-1'>{toman(item.max_price)}</div>
        </div>
      </div>

      <h2 className='text-sm font-bold text-gray-800 mb-2'>فروشندگان</h2>
      <div className='space-y-2'>
        {item.offers.map((o, idx) => (
          <div
            key={`${o.seller}-${o.url}`}
            className={`bg-white rounded-xl shadow-md px-4 py-3 ${o.outlier ? 'opacity-70' : ''}`}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='text-sm text-gray-800 font-semibold'>{o.seller_name}</div>
                <div className='text-xs text-gray-500 mt-0.5 break-words'>{o.raw_name}</div>
                <div className='flex flex-wrap gap-1.5 mt-1.5'>
                  {PRICE_KIND[o.price_kind] && (
                    <span className='text-[10px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5'>
                      قیمت {PRICE_KIND[o.price_kind]}
                    </span>
                  )}
                  {o.brand && ['rebar', 'brick', 'block'].includes(category) && (
                    <span className='text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5'>{o.brand}</span>
                  )}
                  {!o.in_stock && (
                    <span className='text-[10px] bg-red-50 text-red-600 rounded-full px-2 py-0.5'>ناموجود</span>
                  )}
                  {idx === 0 && !o.outlier && (
                    <span className='text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5'>کمترین قیمت</span>
                  )}
                  {o.outlier && (
                    <span className='text-[10px] bg-amber-50 text-amber-700 rounded-full px-2 py-0.5'>
                      {o.outlier === 'low'
                        ? 'خیلی کمتر از سایر فروشندگان — ممکن است قدیمی یا عمده باشد'
                        : 'خیلی بیشتر از سایر فروشندگان'}
                    </span>
                  )}
                </div>
              </div>
              <div className='text-left shrink-0'>
                <div className='font-bold text-gray-800 text-sm'>{toman(o.price)}</div>
                <a
                  href={o.url}
                  target='_blank'
                  rel='nofollow sponsored noopener noreferrer'
                  className='inline-block mt-1.5 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 font-semibold'
                >
                  مشاهده در سایت فروشنده
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sparkline history={item.history} />

      <p className='text-gray-400 text-xs mt-6 leading-relaxed'>
        قیمت‌ها از صفحه‌ی عمومی هر فروشنده در زمان بروزرسانی برداشت شده و ممکن است تغییر کرده باشد. قیمت‌هایی که بسیار دور از سایر
        فروشندگان هستند علامت‌گذاری شده و در «کمترین قیمت» حساب نمی‌شوند. این فروشگاه‌ها توسط خانه‌داده تایید یا پشتیبانی نمی‌شوند؛
        پیش از خرید، قیمت، موجودی، هزینه‌ی حمل و اعتبار فروشنده را خودتان بررسی کنید.
      </p>
    </section>
  );
};

export default MaterialItemPage;
