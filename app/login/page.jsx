'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'react-toastify';

const PHONE_REGEX = /^09\d{9}$/;

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const requestCode = async (e) => {
    e?.preventDefault();

    if (!PHONE_REGEX.test(phone)) {
      toast.error('شماره موبایل نامعتبر است');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (res.status === 200) {
        setIsNewUser(!!data.isNewUser);
        setStep('code');
        setCooldown(60);
      } else if (res.status === 429) {
        setCooldown(data.secondsRemaining || 60);
        setStep('code');
      } else {
        toast.error(data.message || 'خطایی رخ داد');
      }
    } catch (error) {
      console.log(error);
      toast.error('خطایی رخ داد');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (isNewUser && (!firstName.trim() || !lastName.trim())) {
      toast.error('نام و نام خانوادگی را وارد کنید');
      return;
    }
    setSubmitting(true);
    try {
      const result = await signIn('credentials', {
        phone,
        code,
        firstName,
        lastName,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        router.push(callbackUrl);
      } else {
        toast.error('کد وارد شده اشتباه یا منقضی شده است');
      }
    } catch (error) {
      console.log(error);
      toast.error('خطایی رخ داد');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className='container m-auto max-w-lg py-24'>
      <div className='bg-white p-6 rounded-lg shadow-md' dir='rtl'>
        <h1 className='text-2xl font-bold mb-6 text-center'>ورود</h1>

        {step === 'phone' ? (
          <form onSubmit={requestCode}>
            <div className='mb-4'>
              <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='phone'>
                شماره موبایل:
              </label>
              <input
                className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                id='phone'
                type='tel'
                placeholder='09xxxxxxxxx'
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button
              className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline disabled:opacity-50'
              type='submit'
              disabled={submitting}
            >
              ارسال کد
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <div className='mb-4'>
              <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='code'>
                کد تایید ارسال شده به {phone}:
              </label>
              <input
                className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                id='code'
                type='text'
                inputMode='numeric'
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            {isNewUser && (
              <div className='mb-4 grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='firstName'>
                    نام:
                  </label>
                  <input
                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                    id='firstName'
                    type='text'
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='lastName'>
                    نام خانوادگی:
                  </label>
                  <input
                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                    id='lastName'
                    type='text'
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button
              className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline disabled:opacity-50'
              type='submit'
              disabled={submitting}
            >
              ورود
            </button>
            <div className='flex justify-between items-center mt-4 text-sm'>
              <button
                type='button'
                className='text-blue-500 disabled:text-gray-400'
                disabled={cooldown > 0}
                onClick={requestCode}
              >
                {cooldown > 0 ? `ارسال مجدد کد (${cooldown})` : 'ارسال مجدد کد'}
              </button>
              <button
                type='button'
                className='text-gray-500'
                onClick={() => {
                  setStep('phone');
                  setCode('');
                }}
              >
                ویرایش شماره موبایل
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default LoginPage;
