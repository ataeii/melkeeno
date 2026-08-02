'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchMeta } from '@/lib/api';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

const initialForm = {
  sellerType: 'owner',
  listingType: 'buy',
  district: '',
  address: '',
  lat: null,
  lng: null,
  title: '',
  description: '',
  areaM2: '',
  rooms: '',
  floor: '',
  totalFloors: '',
  yearBuilt: '',
  hasParking: false,
  hasElevator: false,
  hasWarehouse: false,
  hasBalcony: false,
  isFurnished: false,
  hasPool: false,
  hasJacuzzi: false,
  hasSauna: false,
  hasRooftop: false,
  price: '',
  rent: '',
  deposit: '',
  priceType: 'negotiable',
  tradeInterest: 'none',
  tradeNotes: '',
  email: '',
  extraPhones: '',
  notes: '',
};

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

const SellPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [districts, setDistricts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeta()
      .then((data) => setDistricts(data.districts || []))
      .catch(() => {});
  }, []);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.district || !form.title) {
      toast.error('محله و عنوان آگهی الزامی است');
      return;
    }
    if (form.listingType === 'buy' && !form.price) {
      toast.error('قیمت فروش را وارد کنید');
      return;
    }
    if (form.listingType === 'rent' && !form.rent && !form.deposit) {
      toast.error('مبلغ اجاره یا ودیعه را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        areaM2: form.areaM2 ? Number(form.areaM2) : undefined,
        rooms: form.rooms ? Number(form.rooms) : undefined,
        floor: form.floor !== '' ? Number(form.floor) : undefined,
        totalFloors: form.totalFloors ? Number(form.totalFloors) : undefined,
        yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
        price: form.price ? Number(form.price) : undefined,
        rent: form.rent ? Number(form.rent) : undefined,
        deposit: form.deposit ? Number(form.deposit) : undefined,
        extraPhones: form.extraPhones
          ? form.extraPhones.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch('/api/user-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'خطایی رخ داد');
        return;
      }

      toast.success('آگهی شما ثبت شد و پس از بررسی منتشر می‌شود');
      router.push('/');
    } catch (error) {
      console.log(error);
      toast.error('خطایی رخ داد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-navy-800 mb-2'>ثبت آگهی ملک</h1>
      <p className='text-gray-500 text-sm mb-6'>
        اطلاعات ملک خود را وارد کنید. آگهی شما پس از بررسی منتشر خواهد شد.
      </p>

      <form onSubmit={handleSubmit} className='bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-6'>
        {/* Seller type */}
        <div>
          <label className={labelClass}>شما مالک هستید یا مشاور املاک؟</label>
          <div className='flex gap-2'>
            {[
              { v: 'owner', l: 'مالک' },
              { v: 'agent', l: 'مشاور املاک' },
            ].map(({ v, l }) => (
              <button
                type='button'
                key={v}
                onClick={() => set('sellerType')(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  form.sellerType === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Listing type */}
        <div>
          <label className={labelClass}>نوع آگهی</label>
          <div className='flex gap-2'>
            {[
              { v: 'buy', l: 'فروش' },
              { v: 'rent', l: 'اجاره' },
            ].map(({ v, l }) => (
              <button
                type='button'
                key={v}
                onClick={() => set('listingType')(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  form.listingType === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>عنوان آگهی</label>
          <input
            type='text'
            value={form.title}
            onChange={set('title')}
            placeholder='مثلاً: آپارتمان ۸۰ متری دو خواب در پونک'
            className={inputClass}
          />
        </div>

        {/* District + address */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className={labelClass}>محله</label>
            <input
              type='text'
              list='district-options'
              value={form.district}
              onChange={set('district')}
              className={inputClass}
            />
            <datalist id='district-options'>
              {districts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>آدرس دقیق (اختیاری)</label>
            <input type='text' value={form.address} onChange={set('address')} className={inputClass} />
          </div>
        </div>

        {/* Location picker */}
        <div>
          <label className={labelClass}>موقعیت روی نقشه (اختیاری — روی نقشه کلیک کنید)</label>
          <div className='h-64 rounded-lg overflow-hidden border border-gray-200'>
            <LocationPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))} />
          </div>
        </div>

        {/* Specs */}
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
          <div>
            <label className={labelClass}>متراژ (متر مربع)</label>
            <input type='number' value={form.areaM2} onChange={set('areaM2')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>تعداد اتاق</label>
            <input type='number' value={form.rooms} onChange={set('rooms')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>طبقه</label>
            <input type='number' value={form.floor} onChange={set('floor')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>تعداد کل طبقات</label>
            <input type='number' value={form.totalFloors} onChange={set('totalFloors')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>سال ساخت</label>
            <input type='number' value={form.yearBuilt} onChange={set('yearBuilt')} className={inputClass} />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className={labelClass}>امکانات</label>
          <div className='flex flex-wrap gap-3'>
            {[
              { k: 'hasParking', l: 'پارکینگ' },
              { k: 'hasElevator', l: 'آسانسور' },
              { k: 'hasWarehouse', l: 'انباری' },
              { k: 'hasBalcony', l: 'بالکن' },
              { k: 'isFurnished', l: 'مبله' },
              { k: 'hasPool', l: 'استخر' },
              { k: 'hasJacuzzi', l: 'جکوزی' },
              { k: 'hasSauna', l: 'سونا' },
              { k: 'hasRooftop', l: 'روف تاپ / پشت‌بام' },
            ].map(({ k, l }) => (
              <label key={k} className='flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 cursor-pointer'>
                <input type='checkbox' checked={form[k]} onChange={set(k)} />
                {l}
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {form.listingType === 'buy' ? (
            <div>
              <label className={labelClass}>قیمت (تومان)</label>
              <input type='number' value={form.price} onChange={set('price')} className={inputClass} />
            </div>
          ) : (
            <>
              <div>
                <label className={labelClass}>اجاره ماهانه (تومان)</label>
                <input type='number' value={form.rent} onChange={set('rent')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>ودیعه (تومان)</label>
                <input type='number' value={form.deposit} onChange={set('deposit')} className={inputClass} />
              </div>
            </>
          )}
          <div>
            <label className={labelClass}>قیمت ثابت است یا قابل مذاکره؟</label>
            <div className='flex gap-2'>
              {[
                { v: 'fixed', l: 'ثابت' },
                { v: 'negotiable', l: 'قابل مذاکره' },
              ].map(({ v, l }) => (
                <button
                  type='button'
                  key={v}
                  onClick={() => set('priceType')(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    form.priceType === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trade interest */}
        <div>
          <label className={labelClass}>تمایل به معاوضه</label>
          <select value={form.tradeInterest} onChange={set('tradeInterest')} className={inputClass}>
            <option value='none'>تمایلی به معاوضه ندارم</option>
            <option value='house'>معاوضه با خانه</option>
            <option value='car'>معاوضه با ماشین</option>
            <option value='house_or_car'>معاوضه با خانه یا ماشین</option>
          </select>
          {form.tradeInterest !== 'none' && (
            <input
              type='text'
              value={form.tradeNotes}
              onChange={set('tradeNotes')}
              placeholder='توضیحات معاوضه (اختیاری)'
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        {/* Contact */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className={labelClass}>شماره تماس اصلی</label>
            <input type='text' value={session?.user?.phone || ''} disabled className={`${inputClass} bg-gray-50 text-gray-400`} />
          </div>
          <div>
            <label className={labelClass}>ایمیل (اختیاری)</label>
            <input type='email' value={form.email} onChange={set('email')} className={inputClass} />
          </div>
          <div className='sm:col-span-2'>
            <label className={labelClass}>شماره‌های تماس اضافی (اختیاری، با ویرگول جدا کنید)</label>
            <input type='text' value={form.extraPhones} onChange={set('extraPhones')} className={inputClass} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>توضیحات و یادداشت‌های دیگر</label>
          <textarea value={form.notes} onChange={set('notes')} rows={4} className={inputClass} />
        </div>

        <button
          type='submit'
          disabled={submitting}
          className='w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
        >
          {submitting ? 'در حال ثبت...' : 'ثبت آگهی'}
        </button>
      </form>
    </section>
  );
};

export default SellPage;
