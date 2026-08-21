'use client';
import { useState } from 'react';
import { toast } from 'react-toastify';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

const initialForm = { name: '', phone: '', email: '', subject: '', message: '' };

const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.message.trim() || (!form.phone.trim() && !form.email.trim())) {
      toast.error('نام، پیام، و حداقل یک راه ارتباطی (تلفن یا ایمیل) را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در ارسال پیام');
      }
      toast.success('پیام شما ارسال شد — به‌زودی با شما تماس می‌گیریم');
      setForm(initialForm);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>تماس با ما</h1>
      <p className='text-gray-500 text-sm mb-8'>
        سوال یا پیشنهادی دارید؟ فرم زیر را پر کنید تا در اسرع وقت پاسخ دهیم.
      </p>

      <div className='max-w-xl'>
        <div className='bg-white rounded-xl shadow-md p-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className={labelClass}>نام و نام‌خانوادگی</label>
              <input type='text' className={inputClass} value={form.name} onChange={update('name')} />
            </div>
            <div className='grid sm:grid-cols-2 gap-4'>
              <div>
                <label className={labelClass}>شماره تماس</label>
                <input type='tel' className={inputClass} value={form.phone} onChange={update('phone')} placeholder='09xxxxxxxxx' />
              </div>
              <div>
                <label className={labelClass}>ایمیل</label>
                <input type='email' className={inputClass} value={form.email} onChange={update('email')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>موضوع</label>
              <input type='text' className={inputClass} value={form.subject} onChange={update('subject')} />
            </div>
            <div>
              <label className={labelClass}>پیام</label>
              <textarea rows={5} className={inputClass} value={form.message} onChange={update('message')} />
            </div>
            <button
              type='submit'
              disabled={submitting}
              className='w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors'
            >
              {submitting ? 'در حال ارسال...' : 'ارسال پیام'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
