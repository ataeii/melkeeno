'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { fetchPoiList } from '@/lib/api';
import {
  FaHospital,
  FaShoppingCart,
  FaBook,
  FaTree,
  FaCoffee,
  FaPrescriptionBottleAlt,
  FaUniversity,
  FaSubway,
  FaDumbbell,
  FaArrowRight,
} from 'react-icons/fa';

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false });

const CATEGORIES = {
  hospital: { label: 'بیمارستان‌ها', icon: <FaHospital className='text-red-500' /> },
  chain_store: { label: 'فروشگاه‌های زنجیره‌ای', icon: <FaShoppingCart className='text-green-600' /> },
  library: { label: 'کتابخانه‌ها', icon: <FaBook className='text-amber-700' /> },
  park: { label: 'پارک‌ها', icon: <FaTree className='text-green-700' /> },
  cafe: { label: 'کافه‌ها', icon: <FaCoffee className='text-yellow-800' /> },
  pharmacy: { label: 'داروخانه‌ها', icon: <FaPrescriptionBottleAlt className='text-red-600' /> },
  bank: { label: 'بانک‌ها', icon: <FaUniversity className='text-blue-800' /> },
  metro: { label: 'ایستگاه‌های مترو', icon: <FaSubway className='text-purple-700' /> },
  gym: { label: 'باشگاه‌های ورزشی', icon: <FaDumbbell className='text-orange-600' /> },
};

const PlacesCategoryClient = () => {
  const { category } = useParams();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const meta = CATEGORIES[category];

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState('');
  // Arriving with ?highlight=<id> (from the family-finder page's "nearest
  // X" cards) jumps straight to the map so the specific match is visible
  // without the user having to scroll/search the list themselves.
  const [mobileView, setMobileView] = useState(highlightId ? 'map' : 'list');

  useEffect(() => {
    if (!meta) return;
    setLoading(true);
    fetchPoiList(category)
      .then((data) => {
        setPlaces(data);
        if (highlightId) {
          const match = data.find((p) => String(p.id) === highlightId);
          if (match) {
            setActiveId(match.id);
            setTimeout(() => {
              document.getElementById(`place-${match.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
        }
      })
      .catch(() => setError('خطا در بارگذاری فهرست'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (!meta) {
    return (
      <section dir='rtl' className='max-w-lg mx-auto px-4 py-16 text-center text-gray-500'>
        دسته‌بندی نامعتبر است.
      </section>
    );
  }

  const filtered = places.filter(
    (p) => !query || p.name.includes(query) || (p.address || '').includes(query)
  );

  const scrollToCard = (id) => {
    document.getElementById(`place-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <section dir='rtl' className='flex flex-col' style={{ height: 'calc(100vh - 64px)' }}>
      <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-wrap'>
        <Link href='/places' className='text-gray-400 hover:text-blue-600'>
          <FaArrowRight />
        </Link>
        <h1 className='text-lg font-extrabold text-navy-800 whitespace-nowrap flex items-center gap-1.5'>
          {meta.icon} {meta.label}
        </h1>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='جستجوی نام یا آدرس...'
          className='flex-1 max-w-xs px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <span className='mr-auto bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap'>
          {loading ? '...' : `${filtered.length} مورد`}
        </span>
      </div>

      {/* Mobile list/map toggle -- a 50/50 split is unusable on a narrow
          phone screen, so only one full-width panel shows at a time. */}
      <div className='md:hidden flex border-b border-gray-100 bg-white'>
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mobileView === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          لیست
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mobileView === 'map' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
          }`}
        >
          نقشه
        </button>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        <div
          className={`${
            mobileView === 'map' ? 'hidden' : 'block'
          } md:block w-full md:w-[360px] flex-shrink-0 h-full overflow-y-auto bg-gray-50 p-3 flex flex-col gap-2`}
        >
          {loading && <div className='text-center text-gray-400 py-8'>در حال بارگذاری...</div>}
          {error && <div className='text-center text-red-500 py-8'>{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className='text-center text-gray-400 py-8'>موردی یافت نشد</div>
          )}
          {filtered.map((place) => (
            <div
              key={place.id}
              id={`place-${place.id}`}
              onClick={() => setActiveId(place.id)}
              className={`bg-white rounded-lg p-3 cursor-pointer transition-colors ${
                activeId === place.id ? 'border-2 border-amber-400' : 'border border-transparent hover:border-gray-200'
              }`}
            >
              <div className='font-bold text-sm text-gray-800 mb-1'>{place.name}</div>
              {place.address && <div className='text-xs text-gray-500 mb-1'>{place.address}</div>}
              {place.phone && <div className='text-xs text-gray-500 mb-1'>📞 {place.phone}</div>}
            </div>
          ))}
        </div>

        <div className={`${mobileView === 'list' ? 'hidden' : 'block'} md:block w-full md:flex-1 relative`}>
          <PlacesMap
            places={filtered}
            activeId={activeId}
            onMarkerClick={(id) => {
              setActiveId(id);
              scrollToCard(id);
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default PlacesCategoryClient;
