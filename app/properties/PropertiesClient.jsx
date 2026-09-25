'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PropertyCard from '@/components/PropertyCard';
import { fetchListings, fetchMeta, nearbyServices } from '@/lib/api';
import { FaHospital, FaSchool, FaTimes } from 'react-icons/fa';

const SearchMap = dynamic(() => import('@/components/SearchMap'), { ssr: false });

const FILTER_DEFAULTS = {
  listing_type: 'buy',
  district: '',
  rooms: '',
  min_area: '',
  min_price: '',
  max_price: '',
  amenities: [],
  sort: 'price_asc',
};

// Keys that count toward the "فیلترها (N)" badge -- listing_type and sort
// are always "set" to something by design, so they don't count as refinements.
const REFINEMENT_KEYS = ['district', 'rooms', 'min_area', 'min_price', 'max_price', 'amenities'];

const AMENITY_OPTIONS = [
  { key: 'parking', label: 'پارکینگ' },
  { key: 'elevator', label: 'آسانسور' },
  { key: 'warehouse', label: 'انباری' },
  { key: 'balcony', label: 'بالکن' },
  { key: 'furnished', label: 'مبله' },
  { key: 'pool', label: 'استخر' },
  { key: 'jacuzzi', label: 'جکوزی' },
  { key: 'sauna', label: 'سونا' },
];

// Cards are rendered in pages of this size -- rendering all ~1,800 at once
// made the list (and the DOM) enormous. The map still gets every listing.
const PAGE_SIZE = 60;

const PropertiesClient = ({ initialListings = [], initialDistricts = [] }) => {
  const [listings, setListings] = useState(initialListings);
  const [districts, setDistricts] = useState(initialDistricts);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeToken, setActiveToken] = useState(null);
  const [hoveredToken, setHoveredToken] = useState(null);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map' -- only used below the md breakpoint
  const [loading, setLoading] = useState(initialListings.length === 0);
  const [error, setError] = useState(null);
  const [servicesInfo, setServicesInfo] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Load meta on mount (unless the server already provided it)
  useEffect(() => {
    if (initialDistricts.length) return;
    fetchMeta()
      .then((data) => {
        if (data.districts) setDistricts(data.districts);
      })
      .catch(() => {});
  }, [initialDistricts.length]);

  // Load listings whenever filters change
  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.listing_type) params.listing_type = filters.listing_type;
      if (filters.district) params.district = filters.district;
      if (filters.rooms) params.rooms = filters.rooms === '4' ? undefined : filters.rooms;
      if (filters.rooms === '4+') params.min_rooms = 4;
      else if (filters.rooms) params.rooms = filters.rooms;
      if (filters.min_area) params.min_area = filters.min_area;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.amenities.length > 0) params.amenities = filters.amenities.join(',');
      if (filters.sort) params.sort = filters.sort;

      const data = await fetchListings(params);
      setListings(Array.isArray(data) ? data : []);
      setVisibleCount(PAGE_SIZE);
    } catch (e) {
      setError('خطا در بارگذاری آگهی‌ها');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const activeListing = listings.find((l) => l.token === activeToken) || null;

  useEffect(() => {
    if (!activeListing || !activeListing.lat || !activeListing.lng) {
      setServicesInfo(null);
      return;
    }
    let cancelled = false;
    setServicesLoading(true);
    nearbyServices({ lat: activeListing.lat, lng: activeListing.lng })
      .then((data) => {
        if (!cancelled) setServicesInfo(data);
      })
      .catch(() => {
        if (!cancelled) setServicesInfo(null);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeListing?.lat, activeListing?.lng]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (key) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(key) ? prev.amenities.filter((a) => a !== key) : [...prev.amenities, key],
    }));
  };

  const handleReset = () => {
    setFilters(FILTER_DEFAULTS);
  };

  const activeFilterCount = REFINEMENT_KEYS.reduce((count, key) => {
    const value = filters[key];
    return count + (Array.isArray(value) ? value.length : value ? 1 : 0);
  }, 0);

  const scrollToCard = (token) => {
    const el = document.getElementById(token);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleMarkerClick = (token) => {
    setActiveToken(token);
    scrollToCard(token);
  };

  const handleCardClick = (token) => {
    setActiveToken(token);
  };

  const selectClass =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 cursor-pointer';

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      {/* Filter bar -- compact row always visible/sticky (type, sort, a
          "فیلترها (N)" toggle showing how many refinements are active), the
          rest collapsed into a panel opened on demand instead of every
          filter always taking up a row. */}
      <div className='sticky top-0 z-20 bg-white shadow-md' dir='rtl'>
        <div className='px-4 py-3 flex flex-wrap items-center gap-2'>
          {/* نوع */}
          <select
            className={selectClass}
            value={filters.listing_type}
            onChange={(e) => handleFilterChange('listing_type', e.target.value)}
          >
            <option value='buy'>خرید</option>
            <option value='rent'>اجاره</option>
            <option value='short_term'>اجاره کوتاه‌مدت</option>
          </select>

          {/* مرتب‌سازی */}
          <select
            className={selectClass}
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value='price_asc'>ارزان‌ترین</option>
            <option value='price_desc'>گران‌ترین</option>
            <option value='area_desc'>بزرگ‌ترین</option>
          </select>

          {/* فیلترها (باز/بسته) */}
          <button
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filtersOpen ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
            }`}
          >
            فیلترها
            {activeFilterCount > 0 && (
              <span className='bg-blue-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center'>
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className='px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors'
            >
              پاک کردن
            </button>
          )}

          {/* Count badge */}
          <span className='mr-auto bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full'>
            {loading ? '...' : `${listings.length} آگهی`}
          </span>
        </div>

        {/* Collapsible refinement panel */}
        {filtersOpen && (
          <div className='px-4 pb-3 pt-1 border-t border-gray-100 flex flex-wrap items-center gap-2'>
            {/* محله */}
            <select
              className={selectClass}
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
            >
              <option value=''>همه محله‌ها</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* اتاق */}
            <select
              className={selectClass}
              value={filters.rooms}
              onChange={(e) => handleFilterChange('rooms', e.target.value)}
            >
              <option value=''>همه اتاق‌ها</option>
              <option value='1'>۱ خواب</option>
              <option value='2'>۲ خواب</option>
              <option value='3'>۳ خواب</option>
              <option value='4+'>۴ خواب و بیشتر</option>
            </select>

            {/* متراژ */}
            <select
              className={selectClass}
              value={filters.min_area}
              onChange={(e) => handleFilterChange('min_area', e.target.value)}
            >
              <option value=''>همه متراژ‌ها</option>
              <option value='40'>۴۰+ متر</option>
              <option value='60'>۶۰+ متر</option>
              <option value='80'>۸۰+ متر</option>
              <option value='100'>۱۰۰+ متر</option>
            </select>

            {/* حداقل قیمت */}
            <input
              type='number'
              inputMode='numeric'
              placeholder='حداقل قیمت (تومان)'
              className={`${selectClass} w-40`}
              value={filters.min_price}
              onChange={(e) => handleFilterChange('min_price', e.target.value)}
            />

            {/* حداکثر قیمت */}
            <select
              className={selectClass}
              value={filters.max_price}
              onChange={(e) => handleFilterChange('max_price', e.target.value)}
            >
              <option value=''>همه قیمت‌ها</option>
              <option value='5000000000'>تا ۵ میلیارد</option>
              <option value='10000000000'>تا ۱۰ میلیارد</option>
              <option value='20000000000'>تا ۲۰ میلیارد</option>
              <option value='50000000000'>تا ۵۰ میلیارد</option>
            </select>

            {/* امکانات */}
            <div className='w-full flex flex-wrap items-center gap-2 mt-1'>
              <span className='text-xs text-gray-400'>امکانات:</span>
              {AMENITY_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleAmenity(key)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    filters.amenities.includes(key)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile list/map toggle -- below md, the 50/50 split is too small to
          be usable in portrait, so only one full-width panel shows at a
          time instead. */}
      <div className='md:hidden flex border-b border-gray-100 bg-white' dir='rtl'>
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

      {/* Main split view */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left panel: listing cards */}
        <div
          className={`${mobileView === 'map' ? 'hidden' : 'block'} md:block w-full md:w-1/2 flex-shrink-0 h-full overflow-y-auto bg-gray-50`}
          dir='rtl'
        >
          <h1 className='px-3 pt-3 text-base font-extrabold text-navy-800'>
            آگهی‌های خرید و اجاره آپارتمان در تهران
          </h1>
          {loading && listings.length === 0 && (
            <div className='flex items-center justify-center h-32 text-gray-400'>
              <span>در حال بارگذاری...</span>
            </div>
          )}
          {error && (
            <div className='flex items-center justify-center h-32 text-red-500'>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && listings.length === 0 && (
            <div className='flex items-center justify-center h-32 text-gray-400'>
              <span>آگهی‌ای یافت نشد</span>
            </div>
          )}
          <div className='p-3 flex flex-col gap-3'>
            {listings.slice(0, visibleCount).map((listing) => (
              <div
                key={listing.token}
                onMouseEnter={() => setHoveredToken(listing.token)}
                onMouseLeave={() => setHoveredToken(null)}
              >
                <PropertyCard
                  property={listing}
                  onClick={handleCardClick}
                  className={
                    activeToken === listing.token
                      ? 'border-2 border-blue-600 ring-2 ring-blue-100'
                      : hoveredToken === listing.token
                      ? 'border-2 border-amber-400 ring-2 ring-amber-100'
                      : 'border border-transparent'
                  }
                />
              </div>
            ))}
            {listings.length > visibleCount && (
              <button
                type='button'
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className='mx-auto my-2 bg-white border border-gray-200 hover:border-blue-500 text-blue-600 text-sm font-semibold px-5 py-2.5 rounded-lg'
              >
                نمایش آگهی‌های بیشتر ({(listings.length - visibleCount).toLocaleString('fa-IR')} آگهی دیگر)
              </button>
            )}
          </div>
        </div>

        {/* Right panel: map */}
        <div className={`${mobileView === 'list' ? 'hidden' : 'block'} md:block w-full md:flex-1 relative`}>
          <SearchMap
            listings={listings}
            activeToken={activeToken}
            onMarkerClick={handleMarkerClick}
            hoveredToken={hoveredToken}
            onMarkerHover={setHoveredToken}
          />

          {activeListing && (
            <div
              dir='rtl'
              className='absolute top-3 right-3 z-10 bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-[280px] max-w-[90vw]'
            >
              <div className='flex items-center justify-between mb-2'>
                <span className='font-bold text-sm text-gray-800'>خدمات نزدیک</span>
                <button onClick={() => setActiveToken(null)} className='text-gray-400 hover:text-gray-600'>
                  <FaTimes />
                </button>
              </div>
              {servicesLoading && <p className='text-xs text-gray-400'>در حال جستجو...</p>}
              {!servicesLoading && servicesInfo && (
                <div className='flex flex-col gap-1.5'>
                  {[
                    { key: 'hospital', label: 'بیمارستان', icon: <FaHospital className='text-red-500' /> },
                    { key: 'elementary_boy', label: 'دبستان پسرانه', icon: <FaSchool className='text-blue-500' /> },
                    { key: 'elementary_girl', label: 'دبستان دخترانه', icon: <FaSchool className='text-pink-500' /> },
                    { key: 'high_boy', label: 'دبیرستان پسرانه', icon: <FaSchool className='text-blue-700' /> },
                    { key: 'high_girl', label: 'دبیرستان دخترانه', icon: <FaSchool className='text-pink-700' /> },
                  ].map(({ key, label, icon }) => {
                    const item = servicesInfo[key];
                    return (
                      <div key={key} className='flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5'>
                        <div className='flex items-center gap-1.5 text-gray-500'>
                          {icon}
                          <span>{label}</span>
                        </div>
                        {item ? (
                          <span className='text-gray-700 font-semibold truncate max-w-[130px]'>
                            {item.name} · {item.duration_min} د
                          </span>
                        ) : (
                          <span className='text-gray-400'>یافت نشد</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesClient;
