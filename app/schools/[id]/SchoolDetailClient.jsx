'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { FaSchool, FaArrowRight, FaStar, FaRegStar } from 'react-icons/fa';
import { fetchAllSchools } from '@/lib/api';

const SchoolLocationMap = dynamic(() => import('@/components/SchoolLocationMap'), { ssr: false });

const Stars = ({ value, onChange, size = 'text-lg' }) => (
  <div className={`flex gap-0.5 ${size}`} dir='ltr'>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type='button'
        disabled={!onChange}
        onClick={() => onChange?.(n)}
        className={onChange ? 'cursor-pointer' : 'cursor-default'}
      >
        {n <= value ? <FaStar className='text-amber-400' /> : <FaRegStar className='text-amber-400' />}
      </button>
    ))}
  </div>
);

const SchoolDetailClient = () => {
  const params = useParams();
  const schoolId = Number(params.id);
  const { data: session } = useSession();

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // No single-school backend endpoint exists -- 147 schools total, so
    // fetching the full list (already cached/used elsewhere via the same
    // helper) and finding by id client-side is simpler than adding one.
    fetchAllSchools()
      .then((data) => {
        const found = (Array.isArray(data) ? data : []).find((s) => s.id === schoolId);
        setSchool(found || null);
      })
      .catch(() => setSchool(null))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const loadReviews = () => {
    setReviewsLoading(true);
    fetch(`/api/school-reviews?schoolId=${schoolId}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setAverage(data.average);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error('امتیاز را انتخاب کنید');
      return;
    }
    if (!comment.trim()) {
      toast.error('متن نظر را بنویسید');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/school-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, schoolName: school?.name, rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'خطا در ثبت نظر');
      }
      toast.success('نظر شما ثبت شد');
      setRating(0);
      setComment('');
      loadReviews();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className='max-w-2xl mx-auto px-4 py-8 text-center text-gray-400'>در حال بارگذاری...</div>;
  }

  if (!school) {
    return (
      <div dir='rtl' className='max-w-2xl mx-auto px-4 py-8 text-center text-gray-400'>
        مدرسه‌ای یافت نشد
      </div>
    );
  }

  return (
    <section dir='rtl' className='max-w-2xl mx-auto px-4 py-8'>
      <Link href='/schools' className='text-blue-600 text-sm font-semibold inline-flex items-center gap-1 mb-4'>
        <FaArrowRight /> بازگشت به مدارس
      </Link>

      <div className='bg-white rounded-xl shadow-md p-5 mb-6'>
        <div className='flex items-start gap-2 mb-2'>
          <FaSchool className='text-blue-700 text-xl mt-1' />
          <h1 className='text-xl font-extrabold text-gray-800'>{school.name}</h1>
        </div>
        {school.address && <p className='text-sm text-gray-500 mb-3'>{school.address}</p>}

        <div className='flex flex-wrap gap-1.5 mb-3'>
          {school.district_num != null && (
            <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full'>
              منطقه {school.district_num}
            </span>
          )}
          {school.base_level && (
            <span className='text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full'>{school.base_level}</span>
          )}
          {school.school_type && (
            <span className='text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full'>{school.school_type}</span>
          )}
          {school.gender && (
            <span className='text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full'>{school.gender}</span>
          )}
        </div>

        <div className='flex items-center gap-2 border-t border-gray-100 pt-3'>
          {average != null ? (
            <>
              <Stars value={Math.round(average)} />
              <span className='text-sm font-bold text-gray-700'>{average}</span>
              <span className='text-xs text-gray-400'>({reviews.length} نظر)</span>
            </>
          ) : (
            <span className='text-xs text-gray-400'>هنوز امتیازی ثبت نشده — اولین نفر باشید</span>
          )}
        </div>
      </div>

      {school.lat != null && school.lng != null && (
        <div className='bg-white rounded-xl shadow-md p-2 mb-6 h-64 overflow-hidden'>
          <SchoolLocationMap lat={school.lat} lng={school.lng} name={school.name} />
        </div>
      )}

      {/* Review form */}
      <div className='bg-white rounded-xl shadow-md p-5 mb-6'>
        <h2 className='font-bold text-gray-800 mb-3'>ثبت نظر</h2>
        {session ? (
          <form onSubmit={handleSubmitReview} className='flex flex-col gap-3'>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>امتیاز شما</label>
              <Stars value={rating} onChange={setRating} size='text-2xl' />
            </div>
            <textarea
              rows={3}
              placeholder='تجربه‌ی خود از این مدرسه را بنویسید...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className='w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <button
              type='submit'
              disabled={submitting}
              className='self-start bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors'
            >
              {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
            </button>
          </form>
        ) : (
          <p className='text-sm text-gray-500'>
            برای ثبت نظر،{' '}
            <Link href='/login' className='text-blue-600 font-semibold hover:underline'>
              وارد شوید
            </Link>
            .
          </p>
        )}
      </div>

      {/* Review list */}
      <div className='bg-white rounded-xl shadow-md p-5'>
        <h2 className='font-bold text-gray-800 mb-3'>نظرات ({reviews.length})</h2>
        {reviewsLoading && <p className='text-sm text-gray-400'>در حال بارگذاری...</p>}
        {!reviewsLoading && reviews.length === 0 && (
          <p className='text-sm text-gray-400'>هنوز نظری ثبت نشده است.</p>
        )}
        <div className='flex flex-col gap-4'>
          {reviews.map((r) => (
            <div key={r._id} className='border-b border-gray-100 pb-3 last:border-0 last:pb-0'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-sm font-semibold text-gray-700'>{r.authorName}</span>
                <Stars value={r.rating} size='text-xs' />
              </div>
              <p className='text-sm text-gray-600 leading-relaxed'>{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchoolDetailClient;
