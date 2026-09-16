import Image from 'next/image';
import { FaSearchLocation, FaShieldAlt, FaHeadset } from 'react-icons/fa';
import PropertySearchForm from './PropertySearchForm';
import heroImage from '@/public/images/hero-family.webp';

const TRUST_POINTS = [
  {
    icon: <FaSearchLocation className='text-2xl' />,
    title: 'آگهی‌های معتبر',
    desc: 'بررسی و تایید شده',
  },
  {
    icon: <FaShieldAlt className='text-2xl' />,
    title: 'محیطی امن',
    desc: 'برای معامله مطمئن',
  },
  {
    icon: <FaHeadset className='text-2xl' />,
    title: 'پشتیبانی حرفه‌ای',
    desc: 'در تمام مراحل',
  },
];

const Hero = () => {
  return (
    <section className='relative overflow-hidden bg-cream pt-14 pb-16 sm:pt-20 sm:pb-20'>
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-center text-2xl sm:text-3xl font-extrabold text-navy-800 mb-6'>
          خانه‌داده، اطلاعات املاک برای هر خانواده
        </h1>

        {/* Picture — capped height rather than the full native 2528x1686
            aspect ratio, which pushed the search form (the actual primary
            action) entirely below the fold on common viewport heights
            (confirmed at 1330x924: the uncapped box alone ran ~887px tall
            before the search bar even started). object-cover crops instead
            of letterboxing since we're no longer preserving the full frame. */}
        <div className='relative w-full h-[200px] sm:h-[300px] md:h-[360px] lg:h-[420px] rounded-2xl overflow-hidden'>
          <Image
            src={heroImage}
            alt='خانواده در حال بازدید از آپارتمان'
            fill
            priority
            className='object-cover'
            sizes='100vw'
          />
        </div>

        {/* Search bar — full width, directly below the picture */}
        <div className='mt-6'>
          <PropertySearchForm />
        </div>

        {/* Trust points */}
        <div dir='rtl' className='mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto'>
          {TRUST_POINTS.map(({ icon, title, desc }) => (
            <div key={title} className='flex flex-col items-center text-center gap-1.5'>
              <span className='text-blue-600'>{icon}</span>
              <span className='text-sm font-bold text-navy-800'>{title}</span>
              <span className='text-xs text-gray-500'>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Hero;
