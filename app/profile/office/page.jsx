'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import Spinner from '@/components/Spinner';

const OfficeLocationPicker = dynamic(() => import('@/components/OfficeLocationPicker'), { ssr: false });

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

const SPECIALTY_OPTIONS = [
  { value: 'buy', label: 'خرید' },
  { value: 'rent', label: 'اجاره' },
  { value: 'commercial', label: 'تجاری' },
  { value: 'residential', label: 'مسکونی' },
];

const STATUS_BADGE = {
  pending: { label: 'در انتظار بررسی', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'تایید‌شده و نمایش داده می‌شود', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'رد شده', className: 'bg-red-100 text-red-600' },
};

const initialForm = {
  name: '',
  address: '',
  phone: '',
  description: '',
  workingHours: '',
  specialties: [],
  lat: null,
  lng: null,
};

const OfficeProfilePage = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    fetch('/api/office')
      .then((res) => res.json())
      .then((data) => {
        if (data && data._id) {
          setForm({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            description: data.description || '',
            workingHours: data.workingHours || '',
            specialties: data.specialties || [],
            lat: data.lat,
            lng: data.lng,
          });
          setStatus(data.status);
          setLogoPreview(data.logoUrl || null);
          setIsNew(false);
        }
      })
      .catch(() => toast.error('خطا در بارگذاری اطلاعات دفتر'))
      .finally(() => setLoading(false));
  }, []);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleSpecialty = (value) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(value)
        ? prev.specialties.filter((s) => s !== value)
        : [...prev.specialties, value],
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoBase64(reader.result);
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      toast.error('نام، آدرس و شماره تماس الزامی است');
      return;
    }
    if (form.lat == null || form.lng == null) {
      toast.error('لطفاً موقعیت دفتر را روی نقشه مشخص کنید');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/office', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, logoBase64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'خطایی رخ داد');
        return;
      }
      setStatus(data.status);
      setIsNew(false);
      setLogoBase64(null);
      toast.success(
        isNew ? 'دفتر شما ثبت شد و پس از بررسی نمایش داده می‌شود' : 'تغییرات ذخیره شد و در انتظار بررسی مجدد است'
      );
    } catch (error) {
      console.log(error);
      toast.error('خطایی رخ داد');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner loading />;

  return (
    <section dir='rtl' className='max-w-2xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-navy-800 mb-2'>
        {isNew ? 'ثبت دفتر املاک' : 'مدیریت دفتر املاک'}
      </h1>
      <p className='text-gray-500 text-sm mb-6'>
        اگر صاحب یا نماینده‌ی یک دفتر املاک هستید، اطلاعات دفتر خود را اینجا ثبت کنید تا در فهرست دفاتر ملکینو نمایش داده شود.
      </p>

      {status && (
        <div className={`text-sm font-semibold px-3 py-2 rounded-lg mb-6 inline-block ${STATUS_BADGE[status].className}`}>
          وضعیت: {STATUS_BADGE[status].label}
        </div>
      )}

      <form onSubmit={handleSubmit} className='bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4'>
        <div>
          <label className={labelClass}>نام دفتر</label>
          <input type='text' value={form.name} onChange={update('name')} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>آدرس</label>
          <input type='text' value={form.address} onChange={update('address')} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>شماره تماس</label>
          <input type='tel' value={form.phone} onChange={update('phone')} placeholder='0912xxxxxxx' className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>ساعات کاری</label>
          <input
            type='text'
            value={form.workingHours}
            onChange={update('workingHours')}
            placeholder='مثلاً: شنبه تا پنجشنبه، ۹ تا ۱۹'
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>توضیحات</label>
          <textarea rows={4} value={form.description} onChange={update('description')} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>تخصص</label>
          <div className='flex flex-wrap gap-2'>
            {SPECIALTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type='button'
                onClick={() => toggleSpecialty(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  form.specialties.includes(opt.value)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>لوگو / عکس دفتر</label>
          <input type='file' accept='image/*' onChange={handleLogoChange} className='text-sm' />
          {logoPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt='' className='mt-2 w-20 h-20 object-cover rounded-lg border border-gray-200' />
          )}
        </div>

        <div>
          <label className={labelClass}>موقعیت روی نقشه (روی نقشه کلیک کنید)</label>
          <div className='h-64 rounded-lg overflow-hidden border border-gray-200'>
            <OfficeLocationPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(lat, lng) => setForm((prev) => ({ ...prev, lat, lng }))}
            />
          </div>
          {form.lat != null && (
            <p className='text-xs text-gray-400 mt-1'>
              موقعیت انتخاب‌شده: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </p>
          )}
        </div>

        <button
          type='submit'
          disabled={saving}
          className='w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2'
        >
          {saving ? 'در حال ذخیره...' : isNew ? 'ثبت دفتر' : 'ذخیره تغییرات'}
        </button>
      </form>
    </section>
  );
};

export default OfficeProfilePage;
