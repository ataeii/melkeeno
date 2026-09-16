import Image from 'next/image';
import Link from 'next/link';
import logoIcon from '@/public/images/logo-icon.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-cream-dark border-t border-cream-dark py-6' dir='rtl'>
      <div className='container mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-2'>
        <span className='flex items-center gap-2 text-navy-800 text-xl font-extrabold tracking-tight'>
          <Image src={logoIcon} alt='' width={28} height={28} className='rounded-md' />
          خانه‌داده
        </span>
        <Link href='/contact' className='text-sm text-gray-500 hover:text-blue-600 font-semibold transition-colors'>
          تماس با ما
        </Link>
        <p className='text-sm text-gray-400'>
          &copy; {currentYear} خانه‌داده. تمامی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
