'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { fetchOffices } from '@/lib/api';

const OfficesMap = dynamic(() => import('@/components/OfficesMap'), { ssr: false });

const OfficesPage = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchOffices()
      .then(setOffices)
      .catch(() => setError('خطا در بارگذاری فهرست دفاتر املاک'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = offices.filter(
    (o) => !query || o.name.includes(query) || (o.address || '').includes(query)
  );

  const scrollToCard = (id) => {
    document.getElementById(`office-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <section dir='rtl' className='flex flex-col' style={{ height: 'calc(100vh - 64px)' }}>
      <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white'>
        <h1 className='text-lg font-extrabold text-navy-800 whitespace-nowrap'>دفاتر املاک</h1>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='جستجوی نام یا آدرس...'
          className='flex-1 max-w-xs px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <span className='mr-auto bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap'>
          {loading ? '...' : `${filtered.length} دفتر`}
        </span>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        <div className='w-[360px] flex-shrink-0 overflow-y-auto bg-gray-50 p-3 flex flex-col gap-2'>
          {loading && <div className='text-center text-gray-400 py-8'>در حال بارگذاری...</div>}
          {error && <div className='text-center text-red-500 py-8'>{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className='text-center text-gray-400 py-8'>دفتری یافت نشد</div>
          )}
          {filtered.map((office) => (
            <div
              key={office.id}
              id={`office-${office.id}`}
              onClick={() => setActiveId(office.id)}
              className={`bg-white rounded-lg p-3 cursor-pointer transition-colors ${
                activeId === office.id ? 'border-2 border-amber-400' : 'border border-transparent hover:border-gray-200'
              }`}
            >
              <div className='font-bold text-sm text-gray-800 mb-1'>{office.name}</div>
              {office.address && <div className='text-xs text-gray-500 mb-1'>{office.address}</div>}
              {office.geocode_confidence === 'low' && (
                <div className='text-[11px] text-amber-600 mb-1'>📍 موقعیت تقریبی است</div>
              )}
              {office.url && (
                <a
                  href={office.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={(e) => e.stopPropagation()}
                  className='text-xs text-blue-600 hover:underline'
                >
                  مشاهده در کیلید ↗
                </a>
              )}
            </div>
          ))}
        </div>

        <div className='flex-1 relative'>
          <OfficesMap
            offices={filtered}
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

export default OfficesPage;
