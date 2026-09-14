'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Spinner from '@/components/Spinner';

const STATUS_BADGE = {
  pending: { label: 'در انتظار بررسی', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'تایید‌شده', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'رد شده', className: 'bg-red-100 text-red-600' },
};

const AdminOfficesPage = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/offices')
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return [];
        }
        return res.json();
      })
      .then(setOffices)
      .catch(() => toast.error('خطا در بارگذاری دفاتر'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (officeId, status) => {
    setActingId(officeId);
    try {
      const res = await fetch('/api/admin/offices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officeId, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === 'approved' ? 'دفتر تایید شد' : 'دفتر رد شد');
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
      <h1 className='text-2xl font-extrabold text-navy-800 mb-6'>بررسی دفاتر املاک</h1>

      <div className='flex flex-col gap-3'>
        {offices.length === 0 && <p className='text-gray-400 text-sm'>هیچ دفتری ثبت نشده است.</p>}
        {offices.map((office) => (
          <div key={office._id} className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='font-bold text-gray-800'>{office.name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_BADGE[office.status].className}`}>
                {STATUS_BADGE[office.status].label}
              </span>
            </div>
            <p className='text-sm text-gray-500 mb-1'>{office.address}</p>
            <p className='text-sm text-gray-500 mb-1'>📞 {office.phone}</p>
            {office.workingHours && <p className='text-sm text-gray-500 mb-1'>🕒 {office.workingHours}</p>}
            {office.description && <p className='text-sm text-gray-600 mb-1'>{office.description}</p>}
            <p className='text-xs text-gray-400 mb-3'>
              ثبت‌کننده: {office.userId?.firstName ? `${office.userId.firstName} ${office.userId.lastName || ''}` : office.userId?.phone}
            </p>
            {office.status !== 'approved' && (
              <button
                onClick={() => act(office._id, 'approved')}
                disabled={actingId === office._id}
                className='bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-1.5 rounded-lg ml-2'
              >
                تایید
              </button>
            )}
            {office.status !== 'rejected' && (
              <button
                onClick={() => act(office._id, 'rejected')}
                disabled={actingId === office._id}
                className='bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold px-4 py-1.5 rounded-lg'
              >
                رد
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdminOfficesPage;
