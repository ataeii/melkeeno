'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { nearbyPoi } from '@/lib/api';
import {
  FaSchool,
  FaHospital,
  FaShoppingCart,
  FaBook,
  FaTree,
  FaCoffee,
  FaPrescriptionBottleAlt,
  FaUniversity,
  FaSubway,
  FaDumbbell,
} from 'react-icons/fa';

// Shared by the family-finder page and the property detail page -- one
// unified selectable checklist covering hospital/schools + the eight OSM/
// Balad categories. Hospital + the four school types default ON (matches
// what used to always show before this became selectable elsewhere).
export const NEARBY_CATEGORIES = [
  { key: 'hospital', label: 'بیمارستان', icon: <FaHospital className='text-red-500' />, defaultOn: true },
  { key: 'elementary_boy', label: 'دبستان پسرانه', icon: <FaSchool className='text-blue-500' />, defaultOn: true },
  { key: 'elementary_girl', label: 'دبستان دخترانه', icon: <FaSchool className='text-pink-500' />, defaultOn: true },
  { key: 'high_boy', label: 'دبیرستان پسرانه', icon: <FaSchool className='text-blue-700' />, defaultOn: true },
  { key: 'high_girl', label: 'دبیرستان دخترانه', icon: <FaSchool className='text-pink-700' />, defaultOn: true },
  { key: 'chain_store', label: 'فروشگاه زنجیره‌ای', icon: <FaShoppingCart className='text-green-600' />, defaultOn: false },
  { key: 'library', label: 'کتابخانه', icon: <FaBook className='text-amber-700' />, defaultOn: false },
  { key: 'park', label: 'پارک', icon: <FaTree className='text-green-700' />, defaultOn: false },
  { key: 'cafe', label: 'کافه', icon: <FaCoffee className='text-yellow-800' />, defaultOn: false },
  { key: 'pharmacy', label: 'داروخانه', icon: <FaPrescriptionBottleAlt className='text-red-600' />, defaultOn: false },
  { key: 'bank', label: 'بانک', icon: <FaUniversity className='text-blue-800' />, defaultOn: false },
  { key: 'metro', label: 'ایستگاه مترو', icon: <FaSubway className='text-purple-700' />, defaultOn: false },
  { key: 'gym', label: 'باشگاه ورزشی', icon: <FaDumbbell className='text-orange-600' />, defaultOn: false },
];

const SCHOOL_CATEGORY_KEYS = new Set(['elementary_boy', 'elementary_girl', 'high_boy', 'high_girl']);

// Schools have a real per-item detail page; the other nine categories only
// have a per-category list+map page (no per-place detail route exists), so
// that's the closest "page pertaining to that particular service" -- with a
// highlight param so the specific match gets focused there.
const placeLink = (key, item) => {
  if (!item) return null;
  if (SCHOOL_CATEGORY_KEYS.has(key)) return `/schools/${item.id}`;
  return `/places/${key}?highlight=${item.id}`;
};

const NearbyPlacesPanel = ({ lat, lng, title = 'خدمات و اماکن نزدیک' }) => {
  const [selectedPoi, setSelectedPoi] = useState(() =>
    NEARBY_CATEGORIES.filter((c) => c.defaultOn).map((c) => c.key)
  );
  const [poiResults, setPoiResults] = useState(null);
  const [poiLoading, setPoiLoading] = useState(false);

  const togglePoi = (key) => {
    setSelectedPoi((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  useEffect(() => {
    if (lat == null || lng == null || selectedPoi.length === 0) {
      setPoiResults(null);
      return;
    }
    let cancelled = false;
    setPoiLoading(true);
    nearbyPoi({ lat, lng, categories: selectedPoi })
      .then((data) => {
        if (!cancelled) setPoiResults(data);
      })
      .catch(() => {
        if (!cancelled) setPoiResults(null);
      })
      .finally(() => {
        if (!cancelled) setPoiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, selectedPoi]);

  if (lat == null || lng == null) return null;

  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4' dir='rtl'>
      <h3 className='font-bold text-gray-800 mb-3'>{title}</h3>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='md:col-span-1 flex flex-col gap-1.5 border-b md:border-b-0 md:border-l border-gray-100 pb-3 md:pb-0 md:pl-4'>
          {NEARBY_CATEGORIES.map(({ key, label, icon }) => (
            <label
              key={key}
              className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none py-1'
            >
              <input
                type='checkbox'
                checked={selectedPoi.includes(key)}
                onChange={() => togglePoi(key)}
                className='w-4 h-4 accent-blue-600 flex-shrink-0'
              />
              {icon}
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className='md:col-span-3'>
          {selectedPoi.length === 0 && (
            <p className='text-sm text-gray-400'>حداقل یک مورد را از فهرست کنار انتخاب کنید</p>
          )}
          {poiLoading && <p className='text-sm text-gray-400'>در حال جستجو...</p>}
          {!poiLoading && poiResults && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {selectedPoi.map((key) => {
                const meta = NEARBY_CATEGORIES.find((c) => c.key === key);
                const item = poiResults[key];
                const href = placeLink(key, item);
                const card = (
                  <div
                    className={`bg-gray-50 rounded-lg p-3 h-full ${
                      href ? 'hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 transition-colors' : ''
                    }`}
                  >
                    <div className='flex items-center gap-1.5 text-xs text-gray-500 mb-1'>
                      {meta.icon}
                      <span>{meta.label}</span>
                    </div>
                    {item ? (
                      <>
                        <div className='text-sm font-semibold text-gray-800 truncate'>{item.name}</div>
                        <div className='text-xs text-gray-400'>{item.duration_min} دقیقه</div>
                      </>
                    ) : (
                      <div className='text-xs text-gray-400'>یافت نشد</div>
                    )}
                  </div>
                );
                return href ? (
                  <Link key={key} href={href}>
                    {card}
                  </Link>
                ) : (
                  <div key={key}>{card}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyPlacesPanel;
