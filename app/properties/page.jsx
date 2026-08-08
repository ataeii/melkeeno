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
  max_price: '',
  sort: 'price_asc',
};

const PropertiesPage = () => {
  const [listings, setListings] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [activeToken, setActiveToken] = useState(null);
  const [hoveredToken, setHoveredToken] = useState(null);
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servicesInfo, setServicesInfo] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Load meta on mount
  useEffect(() => {
    fetchMeta()
      .then((data) => {
        if (data.districts) setDistricts(data.districts);
      })
      .catch(() => {});
  }, []);

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
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.sort) params.sort = filters.sort;

      const data = await fetchListings(params);
      setListings(Array.isArray(data) ? data : []);
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

  const handleReset = () => {
    setFilters(FILTER_DEFAULTS);
  };

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
      {/* Filter bar */}
      <div className='sticky top-0 z-20 bg-white shadow-md px-4 py-3 flex flex-wrap items-center gap-2' dir='rtl'>
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

        {/* قیمت */}
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

        {/* پاک کردن */}
        <button
          onClick={handleReset}
          className='px-3 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors'
        >
          پاک کردن
        </button>

        {/* Count badge */}
        <span className='mr-auto bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full'>
          {loading ? '...' : `${listings.length} آگهی`}
        </span>
      </div>

      {/* Main split view */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left panel: listing cards */}
        <div
          className='w-[400px] flex-shrink-0 overflow-y-auto bg-gray-50'
          style={{ height: 'calc(100vh - 64px)' }}
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
          {!loading && !error && listings.length === 0 && (
            <div className='flex items-center justify-center h-32 text-gray-400'>
              <span>آگهی‌ای یافت نشد</span>
            </div>
          )}
          <div className='p-3 flex flex-col gap-3'>
            {listings.map((listing) => (
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
          </div>
        </div>

        {/* Right panel: map */}
        <div className='flex-1 relative'>
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

export default PropertiesPage;
