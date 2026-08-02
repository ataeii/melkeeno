'use client';
import { useState, useEffect } from 'react';
import PropertyCard from '@/components/PropertyCard';
import BookmarkToggle from '@/components/BookmarkToggle';
import Spinner from '@/components/Spinner';
import { fetchListings, fetchAllSchools } from '@/lib/api';
import { useBookmarks } from '@/context/BookmarksContext';
import { FaSchool } from 'react-icons/fa';

const shortSchoolLabel = (s) => {
  const level = s.base_level || '';
  const short =
    level.includes('دبیرستان') || level.includes('متوسطه دوره دوم')
      ? 'متوسطه ۲'
      : level.includes('ابتدایی') || level.includes('دبستان')
      ? 'ابتدایی'
      : level;
  return [short, s.gender, s.school_type].filter(Boolean).join(' · ');
};

const SavedPage = () => {
  const bookmarks = useBookmarks();
  const [allListings, setAllListings] = useState([]);
  const [allSchools, setAllSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookmarks?.loaded) return;
    Promise.all([fetchListings({}), fetchAllSchools()])
      .then(([listings, schools]) => {
        setAllListings(listings);
        setAllSchools(schools);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookmarks?.loaded]);

  if (!bookmarks?.loaded || loading) return <Spinner loading />;

  const houses = allListings.filter((l) => bookmarks.isBookmarked('listing', l.token));
  const schools = allSchools.filter((s) => bookmarks.isBookmarked('school', s.id));

  return (
    <section dir='rtl' className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-navy-800 mb-6'>ذخیره‌شده‌ها</h1>

      <h2 className='text-lg font-bold text-gray-800 mb-3'>خانه‌ها</h2>
      {houses.length === 0 ? (
        <p className='text-gray-400 text-sm mb-8'>هنوز خانه‌ای ذخیره نکرده‌اید</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10'>
          {houses.map((h) => (
            <PropertyCard key={h.token} property={h} />
          ))}
        </div>
      )}

      <h2 className='text-lg font-bold text-gray-800 mb-3'>مدرسه‌ها</h2>
      {schools.length === 0 ? (
        <p className='text-gray-400 text-sm'>هنوز مدرسه‌ای ذخیره نکرده‌اید</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {schools.map((s) => (
            <div
              key={s.id}
              className='flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-3'
            >
              <div className='min-w-0'>
                <div className='flex items-center gap-1.5 font-bold text-gray-800 text-sm truncate'>
                  <FaSchool className='text-orange-500 flex-shrink-0' />
                  {s.name}
                </div>
                <div className='text-xs text-gray-400 truncate'>منطقه {s.district_num}</div>
                <div className='text-xs text-orange-600 truncate'>{shortSchoolLabel(s)}</div>
              </div>
              <BookmarkToggle type='school' id={s.id} className='w-8 h-8 flex-shrink-0' />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedPage;
