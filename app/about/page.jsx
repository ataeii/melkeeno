import Link from 'next/link';

export const metadata = {
  title: 'درباره ما | خانه‌داده',
  description: 'خانه‌داده چیست و چه خدماتی برای جستجوی ملک، اجاره و خرید خانه در تهران ارائه می‌دهد.',
};

const AboutPage = () => {
  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-gray-800 mb-2'>درباره خانه‌داده</h1>
      <p className='text-gray-500 text-sm mb-8'>
        پلتفرمی برای جستجوی هوشمندتر ملک در تهران — با داده‌های واقعی، نه فقط آگهی‌های خام.
      </p>

      <div className='bg-white rounded-xl shadow-md p-6 space-y-6 text-sm leading-7 text-gray-700'>
        <div>
          <h2 className='text-base font-bold text-gray-800 mb-2'>ماموریت ما</h2>
          <p>
            خانه‌داده با این هدف ساخته شده که جستجوی خانه در تهران را از یک فرآیند خسته‌کننده و پر از آگهی‌های تکراری یا غیرواقعی،
            به تجربه‌ای شفاف و مبتنی بر داده تبدیل کند. آگهی‌های خرید و اجاره را از منابع مختلف کنار هم می‌گذاریم، قیمت‌های
            نامتعارف را شناسایی می‌کنیم، و ابزارهایی می‌سازیم که تصمیم‌گیری را برای خانواده‌ها ساده‌تر می‌کنند.
          </p>
        </div>

        <div>
          <h2 className='text-base font-bold text-gray-800 mb-2'>چه چیزی ارائه می‌دهیم</h2>
          <ul className='list-disc pr-5 space-y-1.5'>
            <li>جستجوی آگهی‌های خرید و اجاره، همراه با برآورد قیمت منصفانه برای هر ملک</li>
            <li>پیشنهاد محله بر اساس نیازهای واقعی خانواده — مدارس، کیفیت هوا، و دسترسی‌ها</li>
            <li>اطلاعات مدارس هر منطقه و موقعیت آن‌ها روی نقشه</li>
            <li>برنامه‌ریز مالی برای تخمین توان خرید یا اجاره</li>
            <li>مقالاتی درباره‌ی بازار مسکن، شهرسازی، و معماری ایرانی</li>
          </ul>
        </div>

        <div>
          <h2 className='text-base font-bold text-gray-800 mb-2'>در تماس باشید</h2>
          <p>
            اگر سوال، پیشنهاد، یا انتقادی دارید، خوشحال می‌شویم از شما بشنویم — از طریق{' '}
            <Link href='/contact' className='text-blue-600 hover:text-blue-700 font-semibold'>
              فرم تماس با ما
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
