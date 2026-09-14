'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchListings } from '@/lib/api';
import { FaTrash } from 'react-icons/fa';
import NearbyPlacesPanel from '@/components/NearbyPlacesPanel';

const FamilyFinderMap = dynamic(() => import('@/components/FamilyFinderMap'), { ssr: false });

const formatToman = (n) => {
  if (!n) return null;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون';
  return n.toLocaleString();
};

const FamilyFinderPage = () => {
  const [selectedHouseToken, setSelectedHouseToken] = useState(null);
  const [houses, setHouses] = useState([]);
  const [housesLoading, setHousesLoading] = useState(true);
  const [hoveredHouse, setHoveredHouse] = useState(null);

  // Real houses to browse, loaded once — short-term/daily rentals are a
  // separate product (see /properties), not permanent housing to live in
  useEffect(() => {
    fetchListings({ listing_type: 'buy,rent' })
      .then((data) => setHouses(Array.isArray(data) ? data : []))
      .catch(() => setHouses([]))
      .finally(() => setHousesLoading(false));
  }, []);

  const selectedHouse = houses.find((h) => h.token === selectedHouseToken) || null;
  const mapHouse = selectedHouse ? { lat: selectedHouse.lat, lng: selectedHouse.lng } : null;

  const selectHouseFromList = (house) => {
    setSelectedHouseToken(house.token);
  };

  const clearSelectedHouse = () => setSelectedHouseToken(null);

  return (
    <div dir='rtl' className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-3xl font-extrabold text-gray-900 mb-2'>پیشنهاد محله</h1>
      <p className='text-gray-500 mb-6'>
        یک خانه واقعی را از لیست انتخاب کنید تا خدمات و اماکن نزدیک به آن — بیمارستان، مدرسه، فروشگاه، پارک و موارد دیگر — را ببینید. (فقط تهران)
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* House picker */}
        <div className='lg:col-span-1 flex flex-col gap-4'>
          <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <p className='text-xs text-gray-400 mb-2'>
              یک خانه را از لیست انتخاب کنید — با نگه‌داشتن ماوس روی هر مورد، محل آن روی نقشه نمایش داده می‌شود
            </p>
            {selectedHouseToken && (
              <div className='flex items-center justify-between text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-1.5 mb-2'>
                <span>🏠 خانه انتخاب شد</span>
                <button onClick={clearSelectedHouse} className='text-red-500 hover:text-red-700 flex items-center gap-1'>
                  <FaTrash className='text-xs' /> بازگشت به لیست
                </button>
              </div>
            )}
            {housesLoading && <p className='text-xs text-gray-400'>در حال بارگذاری خانه‌ها...</p>}
            <div className='flex flex-col gap-1.5 max-h-[600px] overflow-y-auto'>
              {/* Once a house is picked, the rest of the list hides until the
                  user clears the selection above. */}
              {(selectedHouseToken ? houses.filter((h) => h.token === selectedHouseToken) : houses).map((h) => (
                <div
                  key={h.token}
                  onMouseEnter={() => setHoveredHouse({ lat: h.lat, lng: h.lng })}
                  onMouseLeave={() => setHoveredHouse(null)}
                  onClick={() => selectHouseFromList(h)}
                  className={`flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors border ${
                    selectedHouseToken === h.token
                      ? 'bg-green-50 border-green-400'
                      : 'bg-gray-50 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className='relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200'>
                    {h.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.image_url} alt={h.title} className='w-full h-full object-cover' />
                    )}
                    <span
                      className={`absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold text-white py-0.5 ${
                        h.listing_type === 'rent' ? 'bg-green-600' : 'bg-blue-700'
                      }`}
                    >
                      {h.listing_type === 'rent' ? 'اجاره' : 'فروش'}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-bold text-gray-800 truncate'>
                      {formatToman(h.listing_type === 'buy' ? h.price : h.rent || h.deposit)} تومان
                    </p>
                    <p className='text-xs text-gray-500 truncate'>{h.title}</p>
                    <p className='text-[11px] text-gray-400 truncate'>{h.district}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className='lg:col-span-2 h-[420px] rounded-xl overflow-hidden border border-gray-100 shadow-sm'>
          <FamilyFinderMap
            allHouses={!selectedHouseToken ? houses : []}
            onHouseHover={setHoveredHouse}
            onHouseClick={selectHouseFromList}
            house={mapHouse}
            hoveredHouse={hoveredHouse}
          />
        </div>
      </div>

      {mapHouse && (
        <div className='mb-8'>
          <NearbyPlacesPanel
            lat={mapHouse.lat}
            lng={mapHouse.lng}
            title='خدمات و اماکن نزدیک به این خانه'
          />
        </div>
      )}
    </div>
  );
};

export default FamilyFinderPage;
