'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PropertyCard from '@/components/PropertyCard';
import SchoolSearchInput from '@/components/SchoolSearchInput';
import BookmarkToggle from '@/components/BookmarkToggle';
import {
  matchListings,
  matchCustomHouse,
  nearbySchools,
  nearbyServices,
  fetchListings,
  fetchAllSchools,
  submitPendingSchool,
} from '@/lib/api';
import { FaSchool, FaHome, FaTrash, FaRoute, FaPlus, FaHospital } from 'react-icons/fa';

const FamilyFinderMap = dynamic(() => import('@/components/FamilyFinderMap'), { ssr: false });

const formatToman = (n) => {
  if (!n) return null;
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون';
  return n.toLocaleString();
};

const FamilyFinderPage = () => {
  const [mode, setMode] = useState('school'); // 'school' | 'house'
  const [schools, setSchools] = useState([]); // capped at 1 item — single-select
  const [customHouse, setCustomHouse] = useState(null);
  const [selectedHouseToken, setSelectedHouseToken] = useState(null);
  const [listingType, setListingType] = useState('');

  const [houses, setHouses] = useState([]);
  const [housesLoading, setHousesLoading] = useState(true);
  const [hoveredHouse, setHoveredHouse] = useState(null);

  // All scraped schools, shown as browsable dots on the map in school mode
  const [allSchools, setAllSchools] = useState([]);

  // Draft state for a school the user located on the map that isn't in
  // the scraped dataset yet — filled in via a small form, then usable
  // immediately as a match reference and saved for later review.
  const [schoolDraft, setSchoolDraft] = useState(null); // { lat, lng }
  const [schoolDraftName, setSchoolDraftName] = useState('');
  const [schoolDraftGender, setSchoolDraftGender] = useState('پسرانه');
  const [schoolDraftLevel, setSchoolDraftLevel] = useState('ابتدایی');
  const [schoolDraftType, setSchoolDraftType] = useState('دولتی');

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

  // Real houses to browse, loaded once — short-term/daily rentals are a
  // separate product (see /properties), not permanent housing to live in
  useEffect(() => {
    fetchListings({ listing_type: 'buy,rent' })
      .then((data) => setHouses(Array.isArray(data) ? data : []))
      .catch(() => setHouses([]))
      .finally(() => setHousesLoading(false));
  }, []);

  // All scraped schools, loaded once, shown as dots on the map in school mode
  useEffect(() => {
    fetchAllSchools()
      .then((data) => setAllSchools(Array.isArray(data) ? data : []))
      .catch(() => setAllSchools([]));
  }, []);

  const handleMapClick = (lat, lng) => {
    if (mode === 'school') {
      // Clicking empty map area in school mode means "the school I want
      // isn't in the dataset" — open the add-school form instead of
      // guessing a placeholder school.
      setSchoolDraft({ lat, lng });
    }
    // House is picked only from the list now, map click does nothing in that tab
  };

  const clearSchool = () => setSchools([]);

  const handleSchoolSelect = (school) => {
    setSchools([
      {
        lat: school.lat,
        lng: school.lng,
        label: school.name,
        base_level: school.base_level,
        school_type: school.school_type,
      },
    ]);
    setSchoolDraft(null);
  };

  const cancelSchoolDraft = () => {
    setSchoolDraft(null);
    setSchoolDraftName('');
  };

  const submitSchoolDraft = async () => {
    if (!schoolDraft || !schoolDraftName.trim()) return;
    const school = {
      lat: schoolDraft.lat,
      lng: schoolDraft.lng,
      name: schoolDraftName.trim(),
      gender: schoolDraftGender,
      base_level: schoolDraftLevel,
      school_type: schoolDraftType,
    };
    setSchools([
      {
        lat: school.lat,
        lng: school.lng,
        label: school.name,
        base_level: school.base_level,
        school_type: school.school_type,
        custom: true,
      },
    ]);
    setSchoolDraft(null);
    setSchoolDraftName('');
    try {
      await submitPendingSchool(school);
    } catch (e) {
      // Best-effort — the school is already usable as a reference for this
      // session even if saving it for later review failed.
    }
  };

  const resetHouseCalculations = () => {
    setCustomActive(false);
    setCustomInfo(null);
    setNearbyActive(false);
    setNearbyResults(null);
  };

  const selectHouseFromList = (house) => {
    setCustomHouse({ lat: house.lat, lng: house.lng });
    setSelectedHouseToken(house.token);
    setSelectedToken(null);
    resetHouseCalculations();
  };

  const clearSelectedHouse = () => {
    setCustomHouse(null);
    setSelectedHouseToken(null);
    resetHouseCalculations();
  };

  const handleSubmit = async () => {
    if (schools.length === 0) {
      setError('لطفاً یک مدرسه مشخص کنید.');
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedToken(null);
    setCustomActive(false);
    setNearbyActive(false);
    try {
      const data = await matchListings({ work: [], schools, listingType });
      setResults(data);
      if (data.length > 0) setSelectedToken(data[0].token);
    } catch (e) {
      setError('خطا در دریافت پیشنهادها. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCustomHouse = async () => {
    if (!customHouse || schools.length === 0) return;
    setCustomLoading(true);
    setError(null);
    try {
      const data = await matchCustomHouse({ house: customHouse, work: [], schools });
      setCustomInfo(data);
      setCustomActive(true);
      setNearbyActive(false);
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
    } catch (e) {
      setError('خطا در یافتن مدرسه‌های نزدیک. لطفاً دوباره تلاش کنید.');
    } finally {
      setNearbyLoading(false);
    }
  };

  const addNearbySchoolToList = (school) => {
    setSchools([
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

  const [servicesInfo, setServicesInfo] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!mapHouse) {
      setServicesInfo(null);
      return;
    }
    let cancelled = false;
    setServicesLoading(true);
    nearbyServices({ lat: mapHouse.lat, lng: mapHouse.lng })
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
  }, [mapHouse?.lat, mapHouse?.lng]);

  return (
    <div dir='rtl' className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-3xl font-extrabold text-gray-900 mb-2'>پیشنهاد محله برای خانواده</h1>
      <p className='text-gray-500 mb-6'>
        مدرسه فرزندتان را مشخص کنید تا حداکثر ۳ ملک با کمترین زمان تردد واقعی رانندگی به مدرسه به شما
        پیشنهاد شود. همچنین می‌توانید یک خانه واقعی را از لیست انتخاب کنید تا همین اطلاعات برای آن نیز
        محاسبه شود. (فقط تهران)
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        {/* Controls */}
        <div className='lg:col-span-1 flex flex-col gap-4'>
          <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4'>
            <div className='flex gap-2 mb-4'>
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
                <FaHome /> خانه
              </button>
            </div>

            {/* Only the active tab's panel is shown at a time */}
            {mode === 'school' && (
              <div>
                <div className='mb-3'>
                  <SchoolSearchInput onSelect={handleSchoolSelect} />
                </div>
                {schools.length === 0 && !schoolDraft && (
                  <p className='text-xs text-gray-400'>
                    مدرسه را جستجو کنید، روی یکی از نقطه‌های نارنجی روی نقشه کلیک کنید، یا اگر مدرسه
                    مورد نظرتان روی نقشه نیست، جای آن را روی نقشه مشخص کنید تا اطلاعاتش را وارد کنید
                  </p>
                )}
                {schools.length > 0 && (
                  <div className='flex items-center justify-between text-sm text-gray-600 bg-orange-50 rounded-lg px-3 py-1.5'>
                    <div>
                      <span>🏫 {schools[0].label}</span>
                      {schools[0].custom && (
                        <span className='text-[10px] text-orange-500 mr-1'>(در انتظار بررسی)</span>
                      )}
                      {(schools[0].base_level || schools[0].school_type) && (
                        <div className='text-xs text-gray-400'>
                          {[schools[0].base_level, schools[0].school_type].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <button onClick={clearSchool} className='text-red-500 hover:text-red-700'>
                      <FaTrash className='text-xs' />
                    </button>
                  </div>
                )}

                {schoolDraft && (
                  <div className='bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3'>
                    <p className='text-xs text-orange-700 mb-2 font-semibold'>
                      این مدرسه در پایگاه داده نیست — اطلاعاتش را وارد کنید
                    </p>
                    <input
                      type='text'
                      autoFocus
                      placeholder='نام مدرسه'
                      value={schoolDraftName}
                      onChange={(e) => setSchoolDraftName(e.target.value)}
                      className='w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500'
                    />
                    <div className='grid grid-cols-3 gap-1.5 mb-2'>
                      <select
                        value={schoolDraftGender}
                        onChange={(e) => setSchoolDraftGender(e.target.value)}
                        className='text-xs px-1 py-1.5 rounded-lg border border-gray-200'
                      >
                        <option value='پسرانه'>پسرانه</option>
                        <option value='دخترانه'>دخترانه</option>
                      </select>
                      <select
                        value={schoolDraftLevel}
                        onChange={(e) => setSchoolDraftLevel(e.target.value)}
                        className='text-xs px-1 py-1.5 rounded-lg border border-gray-200'
                      >
                        <option value='ابتدایی'>ابتدایی</option>
                        <option value='دبیرستان'>دبیرستان</option>
                      </select>
                      <select
                        value={schoolDraftType}
                        onChange={(e) => setSchoolDraftType(e.target.value)}
                        className='text-xs px-1 py-1.5 rounded-lg border border-gray-200'
                      >
                        <option value='دولتی'>دولتی</option>
                        <option value='غیر دولتی'>غیرانتفاعی</option>
                      </select>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={submitSchoolDraft}
                        disabled={!schoolDraftName.trim()}
                        className='flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors'
                      >
                        ثبت و استفاده به‌عنوان مرجع
                      </button>
                      <button
                        onClick={cancelSchoolDraft}
                        className='px-3 text-xs text-gray-500 hover:text-gray-700'
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === 'house' && (
              <div>
                <p className='text-xs text-gray-400 mb-2'>
                  یک خانه واقعی را از لیست انتخاب کنید — با نگه‌داشتن ماوس روی هر مورد، محل آن روی نقشه نمایش داده می‌شود
                </p>
                {selectedHouseToken && (
                  <div className='flex items-center justify-between text-sm text-gray-700 bg-green-50 rounded-lg px-3 py-1.5 mb-2'>
                    <span>🏠 خانه انتخاب شد</span>
                    <button onClick={clearSelectedHouse} className='text-red-500 hover:text-red-700'>
                      <FaTrash className='text-xs' />
                    </button>
                  </div>
                )}
                {housesLoading && <p className='text-xs text-gray-400'>در حال بارگذاری خانه‌ها...</p>}
                <div className='flex flex-col gap-1.5 max-h-[420px] overflow-y-auto'>
                  {houses.map((h) => (
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
            )}

            {customHouse && (
              <div className='bg-green-50 rounded-lg px-3 py-2 mt-4'>
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
                          <div className='flex items-center gap-1 flex-shrink-0'>
                            <BookmarkToggle type='school' id={s.id} className='w-6 h-6 text-xs' />
                            <button
                              onClick={() => addNearbySchoolToList(s)}
                              title='انتخاب به عنوان مدرسه'
                              className='text-teal-600 hover:text-teal-800'
                            >
                              <FaPlus className='text-xs' />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <label className='block text-sm text-gray-600 mb-1 mt-4'>نوع ملک</label>
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
            schools={schools}
            allSchools={mode === 'school' ? allSchools : []}
            onSchoolMarkerClick={handleSchoolSelect}
            allHouses={mode === 'house' ? houses : []}
            onHouseHover={setHoveredHouse}
            activeMode={mode === 'house' ? null : mode}
            onMapClick={handleMapClick}
            routes={mapRoutes}
            house={mapHouse}
            hoveredHouse={hoveredHouse}
          />
        </div>
      </div>

      {/* Nearby services for whichever house is currently being viewed */}
      {mapHouse && (
        <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-8' dir='rtl'>
          <h3 className='font-bold text-gray-800 mb-3'>خدمات نزدیک به این خانه</h3>
          {servicesLoading && <p className='text-sm text-gray-400'>در حال جستجو...</p>}
          {!servicesLoading && servicesInfo && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
              {[
                { key: 'hospital', label: 'نزدیک‌ترین بیمارستان', icon: <FaHospital className='text-red-500' /> },
                { key: 'elementary_boy', label: 'دبستان پسرانه', icon: <FaSchool className='text-blue-500' /> },
                { key: 'elementary_girl', label: 'دبستان دخترانه', icon: <FaSchool className='text-pink-500' /> },
                { key: 'high_boy', label: 'دبیرستان پسرانه', icon: <FaSchool className='text-blue-700' /> },
                { key: 'high_girl', label: 'دبیرستان دخترانه', icon: <FaSchool className='text-pink-700' /> },
              ].map(({ key, label, icon }) => {
                const item = servicesInfo[key];
                return (
                  <div key={key} className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex items-center gap-1.5 text-xs text-gray-500 mb-1'>
                      {icon}
                      <span>{label}</span>
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
              })}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div>
          <h2 className='text-2xl font-bold text-gray-900 mb-1'>
            {results.length > 0 ? `${results.length} پیشنهاد برتر` : 'نتیجه‌ای یافت نشد'}
          </h2>
          {results.length > 0 && (
            <p className='text-sm text-gray-400 mb-4'>
              با نگه‌داشتن ماوس روی هر کارت، محل آن روی نقشه نمایش داده می‌شود — برای دیدن مسیر رانندگی روی کارت کلیک کنید
            </p>
          )}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {results.map((property) => (
              <div
                key={property.token}
                onMouseEnter={() => setHoveredHouse({ lat: property.lat, lng: property.lng })}
                onMouseLeave={() => setHoveredHouse(null)}
                onClick={() => {
                  setSelectedToken(property.token);
                  setSelectedHouseToken(null);
                  setCustomHouse(null);
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
