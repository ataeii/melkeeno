'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAllSchools } from '@/lib/api';
import { FaSchool } from 'react-icons/fa';

const SchoolsMap = dynamic(() => import('@/components/SchoolsMap'), { ssr: false });

// No external rating source exists for schools (checked both the scraped
// dataset and the source site, tizland.ir -- it has free-text comments but
// no star/numeric rating system at all). melkeeno now has its own review
// system instead (see /schools/[id]) -- starts empty, but each school has
// a real place for ratings/reviews to accumulate going forward.
const SchoolsPage = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchAllSchools()
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch(() => setError('خطا در بارگذاری مدارس'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      {/* Header */}
      <div className='sticky top-0 z-20 bg-white shadow-md px-4 py-3 flex items-center gap-2' dir='rtl'>
        <FaSchool className='text-blue-700' />
        <span className='font-bold text-gray-800'>مدارس تهران</span>
        <span className='mr-auto bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full'>
          {loading ? '...' : `${schools.length} مدرسه`}
        </span>
      </div>

      {/* Main split view */}
      <div className='flex flex-1 overflow-hidden'>
        {/* List panel (renders on the right in RTL) */}
        <div
          className='w-1/2 flex-shrink-0 overflow-y-auto bg-gray-50'
          style={{ height: 'calc(100vh - 56px)' }}
          dir='rtl'
        >
          {loading && (
            <div className='flex items-center justify-center h-32 text-gray-400'>
              <span>در حال بارگذاری...</span>
            </div>
          )}
          {error && (
            <div className='flex items-center justify-center h-32 text-red-500'>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && schools.length === 0 && (
            <div className='flex items-center justify-center h-32 text-gray-400'>
              <span>مدرسه‌ای یافت نشد</span>
            </div>
          )}
          <div className='p-3 flex flex-col gap-2'>
            {schools.map((s) => (
              <Link
                key={s.id}
                href={`/schools/${s.id}`}
                onMouseEnter={() => setHoveredId(s.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`block rounded-xl border p-3 transition-colors ${
                  hoveredId === s.id ? 'bg-red-50 border-red-300' : 'bg-white border-gray-100'
                }`}
              >
                <div className='flex items-start gap-2'>
                  <span className='text-lg'>🏫</span>
                  <div className='min-w-0 flex-1'>
                    <p className='font-bold text-gray-800 text-sm'>{s.name}</p>
                    {s.address && <p className='text-xs text-gray-400 mt-0.5 truncate'>{s.address}</p>}
                    <div className='flex flex-wrap gap-1 mt-1.5'>
                      {s.district_num != null && (
                        <span className='text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full'>
                          منطقه {s.district_num}
                        </span>
                      )}
                      {s.base_level && (
                        <span className='text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full'>
                          {s.base_level}
                        </span>
                      )}
                      {s.school_type && (
                        <span className='text-[11px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full'>
                          {s.school_type}
                        </span>
                      )}
                      {s.gender && (
                        <span className='text-[11px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded-full'>
                          {s.gender}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Map panel (renders on the left in RTL) */}
        <div className='flex-1 relative'>
          <SchoolsMap
            schools={schools}
            hoveredSchoolId={hoveredId}
            onSchoolHover={setHoveredId}
            onSchoolClick={(s) => router.push(`/schools/${s.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default SchoolsPage;
