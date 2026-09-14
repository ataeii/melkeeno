'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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

const MaterialsPage = () => {
  const [items, setItems] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/material-prices')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setItems(data.items || []);
        setUpdatedAt(data.updatedAt);
      })
      .catch(() => setError('خطا در دریافت قیمت مصالح'))
      .finally(() => setLoading(false));
  }, []);

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
          این فروشگاه‌ها توسط ملکینو تایید یا پشتیبانی نمی‌شوند؛ پیش از خرید، قیمت و اعتبار فروشنده را خودتان بررسی کنید.
        </p>
      </div>

      <p className='text-gray-400 text-xs mt-6'>
        منبع قیمت‌ها: قیمت مصالح ساختمانی و آهن‌آلات، فرصت امروز (price.forsatnet.ir)
      </p>
    </section>
  );
};

export default MaterialsPage;
