'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Spinner from '@/components/Spinner';

const STATUS_BADGE = {
  pending: { label: 'در انتظار بررسی', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'تایید‌شده', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'رد شده', className: 'bg-red-100 text-red-600' },
};

const fmt = (n) => (n ? Number(n).toLocaleString('fa-IR') : '—');

const AdminListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/listings')
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return [];
        }
        return res.json();
      })
      .then(setListings)
      .catch(() => toast.error('خطا در بارگذاری آگهی‌ها'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (id, status) => {
    setActingId(id);
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === 'approved' ? 'آگهی منتشر شد' : 'آگهی رد شد');
      load();
    } catch {
      toast.error('خطایی رخ داد');
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <Spinner loading />;
  if (forbidden) {
    return (
      <section dir='rtl' className='max-w-lg mx-auto px-4 py-16 text-center text-gray-500'>
        دسترسی به این صفحه محدود است.
      </section>
    );
  }

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-navy-800 mb-6'>بررسی آگهی‌ها</h1>
      <div className='flex flex-col gap-3'>
        {listings.length === 0 && <p className='text-gray-400 text-sm'>هیچ آگهی‌ای ثبت نشده است.</p>}
        {listings.map((l) => (
          <div key={l._id} className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-bold text-gray-800'>{l.title}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[l.status].className}`}>
                {STATUS_BADGE[l.status].label}
              </span>
            </div>
            <p className='text-sm text-gray-500 mb-1'>
              {l.listingType === 'buy' ? 'فروش' : 'اجاره'} · {l.district} · {l.areaM2 ? `${fmt(l.areaM2)} متر` : '—'}
            </p>
            <p className='text-sm text-gray-500 mb-1'>
              {l.listingType === 'buy' ? `قیمت: ${fmt(l.price)}` : `اجاره: ${fmt(l.rent)} · ودیعه: ${fmt(l.deposit)}`} تومان
            </p>
            <p className='text-sm text-gray-500 mb-1'>
              📞 {l.phone} ·{' '}
              {l.advertiserType === 'office' ? `آژانس املاک ${l.advertiserName}` : 'مالک (بدون حساب آژانس)'}
            </p>
            {l.description && <p className='text-sm text-gray-600 mb-2'>{l.description}</p>}
            <div className='flex gap-2'>
              {l.status !== 'approved' && (
                <button
                  disabled={actingId === l._id}
                  onClick={() => act(l._id, 'approved')}
                  className='bg-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50'
                >
                  تایید و انتشار
                </button>
              )}
              {l.status !== 'rejected' && (
                <button
                  disabled={actingId === l._id}
                  onClick={() => act(l._id, 'rejected')}
                  className='bg-red-50 text-red-600 text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50'
                >
                  رد
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminListingsPage;
