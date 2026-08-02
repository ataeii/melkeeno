'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Spinner from '@/components/Spinner';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

const ProfilePage = () => {
  const { data: session, update } = useSession();
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        setPhone(data.phone || '');
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
      })
      .catch(() => toast.error('خطا در بارگذاری اطلاعات'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('نام و نام خانوادگی الزامی است');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'خطایی رخ داد');
        return;
      }

      await update({ firstName: data.firstName, lastName: data.lastName });
      toast.success('اطلاعات با موفقیت ذخیره شد');
    } catch (error) {
      console.log(error);
      toast.error('خطایی رخ داد');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner loading />;

  return (
    <section dir='rtl' className='max-w-lg mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-navy-800 mb-6'>پروفایل من</h1>

      <form onSubmit={handleSubmit} className='bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4'>
        <div>
          <label className={labelClass}>شماره موبایل</label>
          <input type='text' value={phone} disabled className={`${inputClass} bg-gray-50 text-gray-400`} />
        </div>
        <div>
          <label className={labelClass}>نام</label>
          <input type='text' value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>نام خانوادگی</label>
          <input type='text' value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
        <button
          type='submit'
          disabled={saving}
          className='w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2'
        >
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </form>
    </section>
  );
};

export default ProfilePage;
