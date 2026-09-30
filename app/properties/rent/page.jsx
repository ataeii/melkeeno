import Link from 'next/link';
import { fetchRentDistricts } from '@/lib/api';
import { pageMeta } from '@/lib/seo';
import { formatToman, toFa } from '@/lib/place';
import { rentPagePath } from '@/lib/rentPages';

export const revalidate = 1800;

export const metadata = pageMeta({
  title: 'اجاره آپارتمان در تهران به تفکیک محله — رهن و اجاره | خانه‌داده',
  description:
    'آگهی‌های رهن و اجاره‌ی آپارتمان در محله‌های تهران، همراه با میانه‌ی اجاره، ودیعه و متراژ هر محله: سعادت‌آباد، پاسداران، فرمانیه، نیاوران، شهرک غرب و ...',
  path: '/properties/rent',
});

// Index of the per-neighborhood rental pages (only neighborhoods with enough
// live listings -- the threshold lives in the backend's /api/rent-districts).
const RentIndexPage = async () => {
  const districts = await fetchRentDistricts().catch(() => []);
  return (
    <section dir='rtl' className='max-w-4xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>اجاره آپارتمان در تهران، به تفکیک محله</h1>
      <p className='text-gray-500 text-sm mb-6 leading-7'>
        محله‌هایی که در حال حاضر دست‌کم چند آگهی فعال رهن و اجاره در خانه‌داده دارند، همراه با میانه‌ی اجاره‌ی ماهانه،
        ودیعه و متراژ. با انتخاب هر محله، همه‌ی آگهی‌ها، تحلیل قیمت منصفانه‌ی هرکدام و امکانات اطراف را ببینید.
      </p>
      <div className='grid sm:grid-cols-2 gap-3'>
        {districts.map((d) => (
          <Link
            key={d.district}
            href={rentPagePath(d.district)}
            className='bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-4 transition-shadow'
          >
            <div className='flex items-center justify-between mb-1'>
              <h2 className='font-bold text-gray-800'>اجاره آپارتمان در {d.district}</h2>
              <span className='text-xs text-gray-400'>{toFa(d.count)} آگهی</span>
            </div>
            <p className='text-xs text-gray-500 leading-6'>
              {[
                d.median_deposit ? `ودیعه‌ی میانه ${formatToman(d.median_deposit)}` : null,
                d.median_rent ? `اجاره‌ی میانه ${formatToman(d.median_rent)}` : null,
                d.median_area ? `متراژ رایج ${toFa(d.median_area)} متر` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RentIndexPage;
