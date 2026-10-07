import Link from 'next/link';
import { fetchMaterialItems } from '@/lib/api';
import { MATERIAL_LABELS, toman, faDate, itemPath } from '@/lib/materials';

// Server-rendered on purpose (the old version fetched in the browser, so crawlers saw
// an empty page). Items are products grouped across sellers, Torob-style.
export const revalidate = 600;

const MaterialCategoryPage = async ({ params, searchParams }) => {
  const category = params.category;
  const label = MATERIAL_LABELS[category];
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

  const q = (searchParams?.q || '').trim();
  const multi = searchParams?.multi === '1';
  const data = await fetchMaterialItems(category, { q, min_sellers: multi ? 2 : 1, limit: 200 }).catch(() => null);
  const items = data?.items || [];
  const updatedAt = items.map((i) => i.updated_at).sort().pop();

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <Link href='/materials' className='text-blue-600 text-sm mb-4 inline-block'>
        ← بازگشت به قیمت مصالح
      </Link>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>مقایسه قیمت {label} از فروشندگان مختلف</h1>
      <p className='text-gray-500 text-sm mb-1'>
        هر کالا با قیمت چند فروشنده‌ی آنلاین کنار هم آمده تا بتوانید پیش از خرید ارزان‌ترین را پیدا کنید. قیمت‌ها از صفحه‌ی عمومی هر
        فروشنده برداشت می‌شود.
      </p>
      {updatedAt && <p className='text-gray-400 text-xs mb-5'>آخرین بروزرسانی: {faDate(updatedAt)}</p>}

      <form method='get' className='flex flex-wrap items-center gap-2 mb-5'>
        <input
          name='q'
          defaultValue={q}
          placeholder={`جستجو در ${label} (مثلاً نام برند)`}
          className='flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white'
        />
        <label className='flex items-center gap-1.5 text-xs text-gray-600'>
          <input type='checkbox' name='multi' value='1' defaultChecked={multi} />
          فقط کالاهای دارای ۲ فروشنده یا بیشتر
        </label>
        <button type='submit' className='bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg'>
          جستجو
        </button>
      </form>

      {items.length === 0 && (
        <p className='text-gray-400 text-sm'>
          {q || multi ? 'کالایی با این شرایط پیدا نشد.' : `هنوز قیمتی برای «${label}» ثبت نشده است.`}
        </p>
      )}

      <div className='space-y-2'>
        {items.map((it) => (
          <Link
            key={it.key}
            href={itemPath(category, it.key)}
            className='block bg-white rounded-xl shadow-md px-4 py-3 hover:shadow-lg transition-shadow'
          >
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='text-sm text-gray-800 font-semibold'>{it.label}</h2>
                <div className='text-xs text-gray-400 mt-1'>
                  {it.n_sellers.toLocaleString('fa-IR')} فروشنده · {it.n_offers.toLocaleString('fa-IR')} پیشنهاد
                  {it.n_sellers > 1 && it.max_price > it.min_price && (
                    <> · از {toman(it.min_price)} تا {toman(it.max_price)}</>
                  )}
                </div>
              </div>
              <div className='text-left shrink-0'>
                <div className='font-bold text-gray-800 text-sm'>{toman(it.best_price)}</div>
                <div className='text-[10px] text-green-700'>کمترین · {it.best_seller}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data && data.total > items.length && (
        <p className='text-gray-400 text-xs mt-4'>
          {items.length.toLocaleString('fa-IR')} مورد از {data.total.toLocaleString('fa-IR')} کالا نمایش داده شده؛ برای دیدن بقیه از جستجو
          استفاده کنید.
        </p>
      )}

      <p className='text-gray-400 text-xs mt-6'>
        این فروشگاه‌ها توسط خانه‌داده تایید یا پشتیبانی نمی‌شوند؛ پیش از خرید، قیمت، موجودی و اعتبار فروشنده را خودتان بررسی کنید.
      </p>
    </section>
  );
};

export default MaterialCategoryPage;
