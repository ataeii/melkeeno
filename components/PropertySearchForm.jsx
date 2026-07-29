'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaChevronDown } from 'react-icons/fa';

const PropertySearchForm = () => {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('All');

  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (location === '' && propertyType === 'All') {
      router.push('/properties');
    } else {
      const query = `?location=${location}&propertyType=${propertyType}`;

      router.push(`/properties/search-results${query}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      dir='rtl'
      className='mx-auto max-w-3xl w-full flex flex-col md:flex-row items-stretch gap-2 bg-white rounded-2xl md:rounded-full p-2 shadow-xl'
    >
      <div className='flex-1'>
        <label htmlFor='location' className='sr-only'>
          محله یا شهر
        </label>
        <input
          type='text'
          id='location'
          placeholder='جستجو بر اساس شهر یا محله...'
          className='w-full h-full px-5 py-3 rounded-xl md:rounded-full bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none'
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div className='relative md:border-r md:border-gray-200'>
        <label htmlFor='property-type' className='sr-only'>
          نوع ملک
        </label>
        <select
          id='property-type'
          className='w-full h-full appearance-none pl-8 pr-4 py-3 rounded-xl md:rounded-full bg-gray-50 md:bg-transparent text-gray-700 focus:outline-none cursor-pointer'
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          <option value='All'>همه انواع</option>
          <option value='Apartment'>آپارتمان</option>
          <option value='Studio'>استودیو</option>
          <option value='Condo'>مجتمع مسکونی</option>
          <option value='House'>خانه ویلایی</option>
          <option value='Cabin Or Cottage'>ویلا / کلبه</option>
          <option value='Loft'>لافت</option>
          <option value='Room'>اتاق</option>
          <option value='Other'>سایر</option>
        </select>
        <FaChevronDown className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs' />
      </div>
      <button
        type='submit'
        className='flex items-center justify-center gap-2 px-6 py-3 rounded-xl md:rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400'
      >
        <FaSearch className='text-sm' />
        <span>جستجو</span>
      </button>
    </form>
  );
};
export default PropertySearchForm;
