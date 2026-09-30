import Link from 'next/link';
import { sectionOf, tagLabel } from '@/lib/articleSections';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });

// Card used on /articles and the section pages.
const ArticleCard = ({ a, wide = false }) => (
  <Link
    href={`/articles/${a.slug}`}
    className={`bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col ${
      wide ? 'sm:col-span-2 ring-2 ring-amber-200' : ''
    }`}
  >
    <div className='flex items-center gap-2 mb-2'>
      <span className='text-2xl'>{a.coverEmoji || '📄'}</span>
      {a.pinned && (
        <span className='text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full'>📌 سنجاق‌شده</span>
      )}
      <span className='text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full'>{sectionOf(a) === 'pattern-language' ? 'زبان الگو' : tagLabel(a.category)}</span>
    </div>
    <h3 className='font-bold text-gray-800 mb-1 leading-relaxed'>{a.title}</h3>
    <p className='text-gray-500 text-sm leading-relaxed line-clamp-3 mb-2'>{a.excerpt}</p>
    <span className='text-[11px] text-gray-400 mt-auto'>{formatDate(a.createdAt)}</span>
  </Link>
);

export default ArticleCard;
