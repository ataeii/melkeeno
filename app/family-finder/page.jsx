'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import PropertyCard from '@/components/PropertyCard';
import SchoolSearchInput from '@/components/SchoolSearchInput';
import { matchListings, matchCustomHouse, nearbySchools } from '@/lib/api';
import { FaBriefcase, FaSchool, FaHome, FaTrash, FaRoute, FaPlus } from 'react-icons/fa';

const FamilyFinderMap = dynamic(() => import('@/components/FamilyFinderMap'), { ssr: false });

const FamilyFinderPage = () => {
  const [mode, setMode] = useState('work'); // 'work' | 'school' | 'house'
  const [work, setWork] = useState([]);
  const [schools, setSchools] = useState([]);
  const [customHouse, setCustomHouse] = useState(null);
  const [listingType, setListingType] = useState('');

  const [results, setResults] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [customInfo, setCustomInfo] = useState(null); // { routes, match_score_min }
  const [customActive, setCustomActive] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);

  const [nearbyResults, setNearbyResults] = useState(null);
  const [nearbyActive, setNearbyActive] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const handleMapClick = (lat, lng) => {
    if (mode === 'work') {
      setWork((prev) => [...prev, { lat, lng, label: `محل کار ${prev.length + 1}` }]);
    } else if (mode === 'school') {
      setSchools((prev) => [...prev, { lat, lng, label: `مدرسه ${prev.length + 1}` }]);
    } else {
      setCustomHouse({ lat, lng });
      setCustomActive(false);
      setCustomInfo(null);
      setNearbyActive(false);
      setNearbyResults(null);
    }
  };

  const removeWork = (index) => setWork((prev) => prev.filter((_, i) => i !== index));
  const removeSchool = (index) => setSchools((prev) => prev.filter((_, i) => i !== index));

  const handleSchoolSelect = (school) => {
    setSchools((prev) => [
      ...prev,
      {
        lat: school.lat,
        lng: school.lng,
        label: school.name,
        base_level: school.base_level,
        school_type: school.school_type,
      },
    ]);
  };

  const handleSubmit = async () => {
    if (work.length === 0 && schools.length === 0) {
      setError('لطفاً حداقل یک محل کار یا مدرسه روی نقشه مشخص کنید.');
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedToken(null);
    setCustomActive(false);
    setNearbyActive(false);
    try {
      const data = await matchListings({ work, schools, listingType });
      setResults(data);
      if (data.length > 0) setSelectedToken(data[0].token);
    } catch (e) {
      setError('خطا در دریافت پیشنهادها. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCustomHouse = async () => {
    if (!customHouse || (work.length === 0 && schools.length === 0)) return;
    setCustomLoading(true);
    setError(null);
    try {
      const data = await matchCustomHouse({ house: customHouse, work, schools });
      setCustomInfo(data);
      setCustomActive(true);
      setNearbyActive(false);
      setSelectedToken(null);
    } catch (e) {
      setError('خطا در محاسبه مسیر این خانه. لطفاً دوباره تلاش کنید.');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleFindNearbySchools = async () => {
    if (!customHouse) return;
    setNearbyLoading(true);
    setError(null);
    try {
      const data = await nearbySchools({ lat: customHouse.lat, lng: customHouse.lng });
      setNearbyResults(data);
      setNearbyActive(true);
      setCustomActive(false);
      setSelectedToken(null);
    } catch (e) {
      setError('خطا در یافتن مدرسه‌های نزدیک. لطفاً دوباره تلاش کنید.');
    } finally {
      setNearbyLoading(false);
    }
  };

  const addNearbySchoolToList = (school) => {
    setSchools((prev) => [
      ...prev,
      {
        lat: school.lat,
        lng: school.lng,
        label: school.name,
        base_level: school.base_level,
        school_type: school.school_type,
      },
    ]);
  };

  const selectedResult = results?.find((r) => r.token === selectedToken) || null;
  const mapHouse = customHouse
    ? customHouse
    : selectedResult
    ? { lat: selectedResult.lat, lng: selectedResult.lng }
    : null;
  const mapRoutes = customActive
    ? customInfo?.routes || []
    : nearbyActive
    ? (nearbyResults || []).map((s) => ({ ...s, label: s.name }))
    : selectedResult?.routes || [];

  return (
    <div dir='rtl' className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-3xl font-extrabold text-gray-900 mb-2'>پیشنهاد محله برای خانواده</h1>
      <p className='text-gray-500 mb-6'>
        محل کار و مدرسه‌ فرزندان خود را روی نقشه مشخص کنید (می‌توانید چند محل کار یا مدرسه اضافه
        کنید) تا حداکثر ۳ ملک با کمترین زمان تردد واقعی رانندگی به شما پیشنهاد شود. همچنین می‌توانید
        یک خانه فرضی روی نقشه انتخاب کنید تا همین اطلاعات برای آن نیز محاسبه شود. زمان‌های
        نمایش‌داده‌شده بر اساس شبکه واقعی معابر تخمین زده می‌شوند، اما ترافیک لحظه‌ای تهران را
        به‌طور کامل لحاظ نمی‌کنند. (فقط تهران)
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* Controls */}
        <div className='lg:col-span-1 flex flex-col gap-4'>
          <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <p className='font-bold text-gray-800 mb-3'>روی نقشه کلیک کنید تا مکان اضافه شود</p>
            <div className='flex gap-2 mb-4'>
              <button
                onClick={() => setMode('work')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  mode === 'work' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaBriefcase /> محل کار
              </button>
              <button
                onClick={() => setMode('school')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  mode === 'school' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaSchool /> مدرسه
              </button>
              <button
                onClick={() => setMode('house')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  mode === 'house' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaHome /> خانه فرضی
              </button>
            </div>

            <div className='mb-3'>
              <SchoolSearchInput onSelect={handleSchoolSelect} />
            </div>

            <div className='flex flex-col gap-1 mb-2'>
              {work.map((w, i) => (
                <div key={i} className='flex items-center justify-between text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-1.5'>
                  <span>💼 {w.label}</span>
                  <button onClick={() => removeWork(i)} className='text-red-500 hover:text-red-700'>
                    <FaTrash className='text-xs' />
                  </button>
                </div>
              ))}
              {work.length === 0 && <p className='text-xs text-gray-400'>هنوز محل کاری اضافه نشده</p>}
            </div>

            <div className='flex flex-col gap-1 mb-2'>
              {schools.map((s, i) => (
                <div key={i} className='flex items-center justify-between text-sm text-gray-600 bg-orange-50 rounded-lg px-3 py-1.5'>
                  <div>
                    <span>🏫 {s.label}</span>
                    {(s.base_level || s.school_type) && (
                      <div className='text-xs text-gray-400'>
                        {[s.base_level, s.school_type].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeSchool(i)} className='text-red-500 hover:text-red-700'>
                    <FaTrash className='text-xs' />
                  </button>
                </div>
              ))}
              {schools.length === 0 && <p className='text-xs text-gray-400'>هنوز مدرسه‌ای اضافه نشده</p>}
            </div>

            {customHouse && (
              <div className='bg-green-50 rounded-lg px-3 py-2 mb-4'>
                <div className='flex items-center justify-between text-sm text-gray-700 mb-2'>
                  <span>🏠 خانه فرضی ثبت شد</span>
                  <button
                    onClick={() => {
                      setCustomHouse(null);
                      setCustomActive(false);
                      setCustomInfo(null);
                      setNearbyActive(false);
                      setNearbyResults(null);
                    }}
                    className='text-red-500 hover:text-red-700'
                  >
                    <FaTrash className='text-xs' />
                  </button>
                </div>
                <button
                  onClick={handleCheckCustomHouse}
                  disabled={customLoading}
                  className='w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors mb-2'
                >
                  {customLoading ? 'در حال محاسبه...' : 'محاسبه زمان تردد این خانه'}
                </button>
                {customInfo && customActive && (
                  <p className='text-xs text-green-800 mb-2 text-center'>
                    میانگین زمان تردد: {customInfo.match_score_min} دقیقه
                  </p>
                )}

                <button
                  onClick={handleFindNearbySchools}
                  disabled={nearbyLoading}
                  className='w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors'
                >
                  {nearbyLoading ? 'در حال جستجو...' : 'پیشنهاد ۳ مدرسه نزدیک'}
                </button>
                {nearbyResults && nearbyActive && (
                  <div className='flex flex-col gap-1 mt-2'>
                    {nearbyResults.length === 0 ? (
                      <p className='text-xs text-gray-400 text-center'>مدرسه‌ای یافت نشد</p>
                    ) : (
                      nearbyResults.map((s) => (
                        <div
                          key={s.id}
                          className='flex items-center justify-between text-xs bg-teal-50 rounded-lg px-2 py-1.5'
                        >
                          <div className='text-gray-700'>
                            <span className='font-semibold'>{s.name}</span>
                            <span className='text-gray-400'> · منطقه {s.district_num} · {s.duration_min} دقیقه</span>
                            {(s.base_level || s.school_type) && (
                              <div className='text-orange-600'>
                                {[s.base_level, s.school_type].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => addNearbySchoolToList(s)}
                            title='افزودن به لیست مدرسه‌ها'
                            className='text-teal-600 hover:text-teal-800'
                          >
                            <FaPlus className='text-xs' />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <label className='block text-sm text-gray-600 mb-1'>نوع ملک</label>
            <select
              className='w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
            >
              <option value=''>خرید و اجاره</option>
              <option value='buy'>فقط خرید</option>
              <option value='rent'>فقط اجاره</option>
            </select>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className='w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors'
            >
              {loading ? 'در حال محاسبه مسیرها...' : 'پیدا کردن خانه'}
            </button>
            {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
          </div>
        </div>

        {/* Map */}
        <div className='lg:col-span-2 h-[420px] rounded-xl overflow-hidden border border-gray-100 shadow-sm'>
          <FamilyFinderMap
            work={work}
            schools={schools}
            activeMode={mode}
            onMapClick={handleMapClick}
            routes={mapRoutes}
            house={mapHouse}
          />
        </div>
      </div>

      {/* Results */}
      {results && (
        <div>
          <h2 className='text-2xl font-bold text-gray-900 mb-1'>
            {results.length > 0 ? `${results.length} پیشنهاد برتر` : 'نتیجه‌ای یافت نشد'}
          </h2>
          {results.length > 0 && (
            <p className='text-sm text-gray-400 mb-4'>برای دیدن مسیر رانندگی هر خانه روی کارت آن کلیک کنید</p>
          )}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {results.map((property) => (
              <div
                key={property.token}
                onClick={() => {
                  setSelectedToken(property.token);
                  setCustomActive(false);
                  setNearbyActive(false);
                }}
                className={`relative rounded-2xl transition-all cursor-pointer ${
                  !customActive && !nearbyActive && selectedToken === property.token
                    ? 'ring-2 ring-blue-500'
                    : 'hover:-translate-y-0.5'
                }`}
              >
                {!customActive && !nearbyActive && selectedToken === property.token && (
                  <span className='absolute -top-2 -right-2 z-10 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1'>
                    <FaRoute /> نمایش مسیر
                  </span>
                )}
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyFinderPage;
