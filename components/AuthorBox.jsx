import Link from 'next/link';
import { AUTHORS } from '@/lib/authors';

const AuthorBox = ({ name, hideSeriesLink = false }) => {
  const author = AUTHORS[name];
  if (!author) return null;
  return (
    <div className='mt-8 bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-3'>
      <div className='w-10 h-10 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold shrink-0'>
        {name.charAt(0)}
      </div>
      <div className='text-sm'>
        <p className='font-bold text-gray-800'>{name}</p>
        <p className='text-gray-600 leading-6'>{author.bio}</p>
        {!hideSeriesLink && (
          <Link href={author.url} className='text-blue-700 text-xs font-semibold hover:underline'>
            همه‌ی مقاله‌های مجموعه‌ی «زبان الگو» ←
          </Link>
        )}
      </div>
    </div>
  );
};

export default AuthorBox;
