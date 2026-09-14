'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const CATEGORY_LABELS = {
  cement: 'سیمان',
  rebar: 'میلگرد',
  brick: 'آجر',
  block: 'بلوک',
  gypsum: 'گچ',
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatPrice = (price) => `${price.toLocaleString('fa-IR')} تومان`;

const MaterialSuppliersPage = () => {
  const { category } = useParams();
  const label = CATEGORY_LABELS[category];
  const [items, setItems] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category) return;
    fetch(`/api/supplier-prices?category=${category}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setItems(data.items || []);
        setUpdatedAt(data.updatedAt);
      })
      .catch(() => setError('خطا در دریافت قیمت فروشندگان'))
      .finally(() => setLoading(false));
  }, [category]);

  if (!label) {
    return (
      <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
        <p className='text-gray-500 text-sm'>دسته‌ی نامعتبر.</p>
        <Link href='/materials' className='text-blue-600 text-sm'>
          بازگشت به قیمت مصالح
        </Link>
      </section>
    );
  }

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <Link href='/materials' className='text-blue-600 text-sm mb-4 inline-block'>
        ← بازگشت به قیمت مصالح
      </Link>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>مقایسه قیمت {label} فروشندگان مختلف</h1>
      <p className='text-gray-500 text-sm mb-1'>
        قیمت واقعی {label} نزد چند فروشنده‌ی آنلاین، برای مقایسه پیش از خرید — نه یک قیمت میانگین بازار.
      </p>
      {updatedAt && <p className='text-gray-400 text-xs mb-8'>آخرین بروزرسانی: {formatDate(updatedAt)}</p>}
      {!updatedAt && <div className='mb-8' />}

      {loading && <p className='text-gray-400 text-sm'>در حال بارگذاری...</p>}
      {error && <p className='text-red-500 text-sm'>{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className='text-gray-400 text-sm'>
          هنوز هیچ فروشنده‌ای برای «{label}» ثبت نشده — این بخش به‌مرور با افزودن فروشندگان بیشتر تکمیل می‌شود.
        </p>
      )}

      <div className='space-y-2'>
        {items.map((row, idx) => (
          <a
            key={row._id || idx}
            href={row.productUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center justify-between bg-white rounded-xl shadow-md px-4 py-3 hover:shadow-lg transition-shadow'
          >
            <div>
              <div className='text-sm text-gray-800 font-medium'>{row.name}</div>
              <div className='text-xs text-gray-400 mt-0.5'>
                {row.supplierName}
                {row.spec && ` · ${row.spec}`}
              </div>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <span className='font-semibold text-gray-800 text-sm'>{formatPrice(row.price)}</span>
              {idx === 0 && (
                <span className='text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5'>کمترین قیمت</span>
              )}
            </div>
          </a>
        ))}
      </div>

      {items.length > 0 && (
        <p className='text-gray-400 text-xs mt-6'>
          این فروشگاه‌ها توسط ملکینو تایید یا پشتیبانی نمی‌شوند؛ پیش از خرید، قیمت، موجودی و اعتبار فروشنده را خودتان
          بررسی کنید. قیمت‌ها از صفحه‌ی عمومی هر فروشنده در زمان بروزرسانی برداشت شده‌اند.
        </p>
      )}
    </section>
  );
};

export default MaterialSuppliersPage;
