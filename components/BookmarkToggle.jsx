'use client';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useBookmarks } from '@/context/BookmarksContext';

// type: 'listing' (Divar token) | 'school' (scraper school id)
// Was "نشان کردن" (mark) with a bookmark icon for listings and "ذخیره
// کردن" (save) for schools -- inconsistent wording for the same action.
// Standardized on "ذخیره" everywhere, matching the nav tab's own name for
// this feature ("ذخیره‌شده‌ها"), with a heart icon that fills when saved.
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

  const title = bookmarked ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره کردن این مورد';

  return (
    <button type='button' onClick={handleClick} title={title} aria-label={title}
      className={`flex items-center justify-center rounded-full transition-colors ${
        bookmarked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      } ${className}`}
    >
      {bookmarked ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
};

export default BookmarkToggle;
