'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { fetchListingsPage, fetchListingPoints, fetchListing } from '@/lib/api';
import { FaTrash } from 'react-icons/fa';
import NearbyPlacesPanel from '@/components/NearbyPlacesPanel';
import { houseSummary } from '@/lib/houseSummary';

const FamilyFinderMap = dynamic(() => import('@/components/FamilyFinderMap'), { ssr: false });

// The list loads a page at a time and the map draws lightweight points, instead of
// downloading every listing (~5 MB, 15-20 s) up front.
const PAGE_SIZE = 30;

const FamilyFinderPage = () => {
  const [selectedHouseToken, setSelectedHouseToken] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [houseType, setHouseType] = useState('buy'); // sale and rent prices aren't comparable -> one list at a time
  const [houses, setHouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [points, setPoints] = useState([]);
  const [housesLoading, setHousesLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hoveredHouse, setHoveredHouse] = useState(null);

  // Real houses to browse -- short-term/daily rentals are a separate product (see /properties),
  // not permanent housing to live in. First page of the list + a point for every house on the map.
  useEffect(() => {
    let cancelled = false;
    setHousesLoading(true);
    setHouses([]);
    setPoints([]);
    setSelectedHouseToken(null);
    setHoveredHouse(null);
    fetchListingsPage({ listing_type: houseType, sort: 'price_asc', limit: PAGE_SIZE, offset: 0 })
      .then(({ items, total: count }) => {
        if (cancelled) return;
        setHouses(items);
        setTotal(count);
      })
      .catch(() => !cancelled && setHouses([]))
      .finally(() => !cancelled && setHousesLoading(false));
    fetchListingPoints({ listing_type: houseType })
      .then((pts) => !cancelled && setPoints(pts))
      .catch(() => !cancelled && setPoints([]));
    return () => {
      cancelled = true;
    };
  }, [houseType]);

  const loadMore = async () => {
    if (loadingMore || houses.length >= total) return;
    setLoadingMore(true);
    try {
      const { items } = await fetchListingsPage({
        listing_type: houseType,
        sort: 'price_asc',
        limit: PAGE_SIZE,
        offset: houses.length,
      });
      setHouses((prev) => {
        const seen = new Set(prev.map((h) => h.token));
        return [...prev, ...items.filter((h) => !seen.has(h.token))];
      });
    } catch {
      /* keep what is already shown */
    } finally {
      setLoadingMore(false);
    }
  };

  // A house picked on the map may not be on a loaded page yet -- fetch its details for the list.
  useEffect(() => {
    if (!selectedHouseToken || houses.some((h) => h.token === selectedHouseToken)) {
      setSelectedDetail(null);
      return;
    }
    let cancelled = false;
    fetchListing(selectedHouseToken)
      .then((d) => !cancelled && setSelectedDetail(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedHouseToken, houses]);

  const selectedPoint = points.find((p) => p.token === selectedHouseToken) || null;
  const selectedHouse =
    houses.find((h) => h.token === selectedHouseToken) ||
    (selectedDetail?.token === selectedHouseToken ? selectedDetail : null);
  const placed = selectedHouse || selectedPoint;
  const mapHouse = placed ? { lat: placed.lat, lng: placed.lng } : null;

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
              یک خانه را از لیست یا از روی نقشه انتخاب کنید — با نگه‌داشتن ماوس روی هر مورد، محل و مشخصات آن را می‌بینید
            </p>
            <div className='flex items-center gap-1.5 mb-2'>
              {[
                ['buy', 'فروش'],
                ['rent', 'اجاره'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type='button'
                  onClick={() => setHouseType(key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    houseType === key
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
              {!housesLoading && (
                <span className='mr-auto text-[11px] text-gray-400'>{total.toLocaleString('fa-IR')} ملک</span>
              )}
            </div>
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
              {(selectedHouseToken ? [selectedHouse].filter(Boolean) : houses).map((h) => (
                <div
                  key={h.token}
                  onMouseEnter={() => setHoveredHouse({ lat: h.lat, lng: h.lng, ...houseSummary(h) })}
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
                      {houseSummary(h).price}
                    </p>
                    <p className='text-xs text-gray-500 truncate'>{h.title}</p>
                    <p className='text-[11px] text-gray-400 truncate'>{h.district}</p>
                  </div>
                </div>
              ))}
              {!selectedHouseToken && houses.length < total && (
                <button
                  type='button'
                  onClick={loadMore}
                  disabled={loadingMore}
                  className='mx-auto my-2 bg-white border border-gray-200 hover:border-blue-500 text-blue-600 text-xs font-semibold px-4 py-2 rounded-lg'
                >
                  {loadingMore ? 'در حال بارگذاری...' : `نمایش بیشتر (${(total - houses.length).toLocaleString('fa-IR')} ملک دیگر)`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className='lg:col-span-2 h-[420px] rounded-xl overflow-hidden border border-gray-100 shadow-sm'>
          <FamilyFinderMap
            allHouses={!selectedHouseToken ? points : []}
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
