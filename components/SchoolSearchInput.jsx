'use client';
import { useState, useRef } from 'react';
import { searchSchools } from '@/lib/api';

const SchoolSearchInput = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setOptions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchSchools(value.trim());
        setOptions(data);
      } catch (e) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (school) => {
    onSelect(school);
    setQuery('');
    setOptions([]);
  };

  return (
    <div className='relative'>
      <input
        type='text'
        value={query}
        onChange={handleChange}
        placeholder='یا نام مدرسه را جستجو کنید (تهران)...'
        className='w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500'
      />
      {loading && (
        <div className='absolute left-3 top-2.5 text-xs text-gray-400'>...</div>
      )}
      {options.length > 0 && (
        <div className='absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto'>
          {options.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className='w-full text-right px-3 py-2 text-sm hover:bg-orange-50 border-b border-gray-50 last:border-0'
            >
              <div className='font-semibold text-gray-800'>{s.name}</div>
              <div className='text-xs text-gray-400 truncate'>
                منطقه {s.district_num} {s.gender ? `· ${s.gender}` : ''} {s.school_type ? `· ${s.school_type}` : ''}
              </div>
              {s.base_level && (
                <div className='text-xs text-orange-600 truncate'>{s.base_level}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolSearchInput;
