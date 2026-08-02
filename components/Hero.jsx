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
        {/* Picture — full width, entire original 2528x1686 image, no crop
            (the box's aspect ratio matches the source file exactly) */}
        <div className='relative w-full aspect-[2528/1686]'>
          <Image
            src={heroImage}
            alt='خانواده در حال بازدید از آپارتمان'
            fill
            priority
            className='object-contain'
            sizes='100vw'
          />
        </div>

        {/* Search bar — full width, directly below the picture */}
        <div className='mt-8'>
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
