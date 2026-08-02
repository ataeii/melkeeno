'use client';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { useBookmarks } from '@/context/BookmarksContext';

// type: 'listing' (Divar token) | 'school' (scraper school id)
const BookmarkToggle = ({ type, id, className = '' }) => {
  const bookmarks = useBookmarks();
  if (!bookmarks) return null;

  const { isBookmarked, toggleListing, toggleSchool } = bookmarks;
  const bookmarked = isBookmarked(type, id);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    type === 'listing' ? toggleListing(id) : toggleSchool(id);
  };

  const title =
    type === 'listing'
      ? bookmarked
        ? 'حذف نشان'
        : 'نشان کردن'
      : bookmarked
      ? 'حذف از ذخیره‌شده‌ها'
      : 'ذخیره کردن';

  return (
    <button type='button' onClick={handleClick} title={title}
      className={`flex items-center justify-center rounded-full transition-colors ${
        bookmarked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'
      } ${className}`}
    >
      {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
    </button>
  );
};

export default BookmarkToggle;
