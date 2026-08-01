'use client';
import { useState, useEffect } from 'react';
import { fetchAirQuality } from '@/lib/api';

const colorFor = (aqi) => {
  if (aqi <= 50) return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
  if (aqi <= 100) return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
  if (aqi <= 150) return { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' };
  if (aqi <= 200) return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
  if (aqi <= 300) return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };
  return { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-700' };
};

const AirQualityBadge = ({ className = '' }) => {
  const [aqi, setAqi] = useState(null);

  useEffect(() => {
    fetchAirQuality()
      .then((data) => {
        if (data && !data.error) setAqi(data);
      })
      .catch(() => {});
  }, []);

  if (!aqi) return null;
  const c = colorFor(aqi.aqi_now);

  return (
    <a
      href='https://airnow.tehran.ir/'
      target='_blank'
      rel='noopener noreferrer'
      title={`آلاینده غالب: ${aqi.aqi_now_pollutant || '-'} · منبع: ${aqi.source}`}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${c.bg} ${c.text} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span>هوای تهران: {aqi.aqi_now_category} ({aqi.aqi_now})</span>
    </a>
  );
};

export default AirQualityBadge;
