import Image from 'next/image';
import { FaSearchLocation, FaShieldAlt, FaHeadset } from 'react-icons/fa';
import PropertySearchForm from './PropertySearchForm';
import heroImage from '@/public/images/hero-family.png';

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
        {/* Heading — stacked above the picture on mobile (the photo is too
            short there for legible overlaid text on top of the family), and
            overlaid on the picture's blank-wall left portion from sm: up,
            matching the composition the image was generated with room for. */}
        <div className='sm:hidden mb-4'>
          <h1 className='text-xl font-extrabold text-navy-800 leading-snug'>
            خانه‌داده، اطلاعات املاک برای هر خانواده
          </h1>
          <p className='mt-2 text-sm text-gray-600 font-medium'>
            ساده‌تر و سریع‌تر از همیشه، خانه، آپارتمان یا ملک دلخواهت را پیدا کن.
          </p>
        </div>

        {/* Picture — capped height rather than the full native aspect ratio,
            which pushed the search form (the actual primary action) entirely
            below the fold on common viewport heights (confirmed at 1330x924:
            the uncapped box alone ran ~887px tall before the search bar even
            started). object-cover crops instead of letterboxing since we're
            no longer preserving the full frame -- at every breakpoint here
            the container is wider-than-tall relative to the image's native
            1536x1024 ratio, so object-cover only trims top/bottom and always
            keeps the full width, including the plain-wall left portion the
            image was generated with room for the headline over it. */}
        <div className='relative w-full h-[220px] sm:h-[340px] md:h-[400px] lg:h-[460px] rounded-2xl overflow-hidden'>
          <Image
            src={heroImage}
            alt='خانواده در حال بازدید از آپارتمان'
            fill
            priority
            className='object-cover'
            sizes='100vw'
          />
          <div className='hidden sm:flex absolute inset-y-0 left-0 w-1/2 lg:w-[42%] items-center px-6 lg:px-8'>
            <div>
              <h1 className='text-2xl lg:text-3xl font-extrabold text-navy-800 leading-snug'>
                خانه‌داده، اطلاعات املاک برای هر خانواده
              </h1>
              <p className='mt-3 text-base text-gray-700 font-medium'>
                ساده‌تر و سریع‌تر از همیشه، خانه، آپارتمان یا ملک دلخواهت را پیدا کن.
              </p>
            </div>
          </div>
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
