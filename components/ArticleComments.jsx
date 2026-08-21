'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

// Comments are open to everyone -- logged-in users comment under their real
// name automatically; anyone else can type a display name (or leave it
// blank and post as "ناشناس"). No login required, per explicit request.
const ArticleComments = ({ articleSlug }) => {
  const { data: session } = useSession();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = () => {
    setLoading(true);
    fetch(`/api/article-comments?slug=${encodeURIComponent(articleSlug)}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('متن نظر را بنویسید');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/article-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleSlug, comment, authorName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'خطا در ثبت نظر');
      }
      toast.success('نظر شما ثبت شد');
      setComment('');
      setAuthorName('');
      loadComments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='bg-white rounded-xl shadow-md p-5 mt-6' dir='rtl'>
      <h2 className='font-bold text-gray-800 mb-3'>نظرات ({comments.length})</h2>

      <form onSubmit={handleSubmit} className='flex flex-col gap-2 mb-6'>
        {!session && (
          <input
            type='text'
            placeholder='نام شما (اختیاری — در صورت خالی گذاشتن، «ناشناس» ثبت می‌شود)'
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className='w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        )}
        {session && (
          <p className='text-xs text-gray-400'>
            به‌عنوان {session.user.firstName ? `${session.user.firstName} ${session.user.lastName || ''}`.trim() : session.user.phone} نظر ثبت می‌کنید
          </p>
        )}
        <textarea
          rows={3}
          placeholder='نظر خود را بنویسید...'
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

      {loading && <p className='text-sm text-gray-400'>در حال بارگذاری...</p>}
      {!loading && comments.length === 0 && <p className='text-sm text-gray-400'>هنوز نظری ثبت نشده — اولین نفر باشید.</p>}
      <div className='flex flex-col gap-4'>
        {comments.map((c) => (
          <div key={c._id} className='border-b border-gray-100 pb-3 last:border-0 last:pb-0'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-sm font-semibold text-gray-700'>{c.authorName}</span>
              <span className='text-[11px] text-gray-400'>
                {new Date(c.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <p className='text-sm text-gray-600 leading-relaxed whitespace-pre-wrap'>{c.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleComments;
