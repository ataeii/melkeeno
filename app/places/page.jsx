import Link from 'next/link';
import {
  FaHospital,
  FaShoppingCart,
  FaBook,
  FaTree,
  FaCoffee,
  FaPrescriptionBottleAlt,
  FaUniversity,
  FaSubway,
  FaDumbbell,
} from 'react-icons/fa';

export const metadata = {
  title: 'نقاط مورد علاقه | ملکینو',
  description: 'فهرست بیمارستان‌ها، فروشگاه‌های زنجیره‌ای، پارک‌ها، کافه‌ها، داروخانه‌ها، بانک‌ها، ایستگاه‌های مترو و باشگاه‌های ورزشی تهران روی نقشه.',
};

const CATEGORIES = [
  { key: 'hospital', label: 'بیمارستان‌ها', icon: <FaHospital className='text-red-500' /> },
  { key: 'chain_store', label: 'فروشگاه‌های زنجیره‌ای', icon: <FaShoppingCart className='text-green-600' /> },
  { key: 'library', label: 'کتابخانه‌ها', icon: <FaBook className='text-amber-700' /> },
  { key: 'park', label: 'پارک‌ها', icon: <FaTree className='text-green-700' /> },
  { key: 'cafe', label: 'کافه‌ها', icon: <FaCoffee className='text-yellow-800' /> },
  { key: 'pharmacy', label: 'داروخانه‌ها', icon: <FaPrescriptionBottleAlt className='text-red-600' /> },
  { key: 'bank', label: 'بانک‌ها', icon: <FaUniversity className='text-blue-800' /> },
  { key: 'metro', label: 'ایستگاه‌های مترو', icon: <FaSubway className='text-purple-700' /> },
  { key: 'gym', label: 'باشگاه‌های ورزشی', icon: <FaDumbbell className='text-orange-600' /> },
];

const PlacesHubPage = () => {
  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>نقاط مورد علاقه</h1>
      <p className='text-gray-500 text-sm mb-8'>
        فهرست کامل هر دسته، همراه با آدرس، تلفن (در صورت موجود بودن) و موقعیت روی نقشه.
      </p>

      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        {CATEGORIES.map(({ key, label, icon }) => (
          <Link
            key={key}
            href={`/places/${key}`}
            className='flex flex-col items-center justify-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-blue-300 transition-colors text-center'
          >
            <span className='text-2xl'>{icon}</span>
            <span className='text-sm font-semibold text-gray-700'>{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PlacesHubPage;
