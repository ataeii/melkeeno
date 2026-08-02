'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FaBars, FaTimes } from 'react-icons/fa';
import AirQualityBadge from './AirQualityBadge';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className='sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-cream-dark shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-3 items-center h-16' dir='rtl'>
          {/* Nav links (right side in RTL) */}
          <div className='hidden md:flex items-center gap-1'>
            <Link
              href='/properties'
              className={`${
                pathname === '/properties' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              } hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2 text-sm font-semibold transition-colors`}
            >
              آگهی‌ها
            </Link>
            <Link
              href='/family-finder'
              className={`${
                pathname === '/family-finder' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              } hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2 text-sm font-semibold transition-colors`}
            >
              پیشنهاد محله
            </Link>
            <Link
              href='/properties/saved'
              className={`${
                pathname === '/properties/saved' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              } hover:bg-blue-50 hover:text-blue-600 rounded-full px-4 py-2 text-sm font-semibold transition-colors`}
            >
              ذخیره‌شده‌ها
            </Link>
            <AirQualityBadge />
          </div>

          {/* Mobile menu button */}
          <div className='flex md:hidden items-center'>
            <button
              type='button'
              id='mobile-dropdown-button'
              className='inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              aria-controls='mobile-menu'
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className='sr-only'>باز کردن منو</span>
              {isMobileMenuOpen ? (
                <FaTimes className='h-5 w-5' />
              ) : (
                <FaBars className='h-5 w-5' />
              )}
            </button>
          </div>

          {/* Logo — always centered */}
          <div className='flex justify-center'>
            <Link href='/' className='flex items-center'>
              <span className='text-navy-800 text-2xl font-extrabold tracking-tight'>
                ملکینو
              </span>
            </Link>
          </div>

          {/* Auth (left side in RTL) */}
          <div className='hidden md:flex items-center justify-end gap-2'>
            {status !== 'loading' &&
              (session ? (
                <div className='flex items-center gap-3'>
                  <span className='text-gray-500 text-sm'>{session.user.phone}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className='text-gray-600 hover:bg-gray-100 rounded-full px-4 py-2 text-sm font-semibold transition-colors'
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <Link
                  href='/login'
                  className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors'
                >
                  ورود
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div id='mobile-menu' dir='rtl' className='md:hidden border-t border-gray-100'>
          <div className='space-y-1 px-4 pb-3 pt-2'>
            <Link
              href='/properties'
              className={`${
                pathname === '/properties' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              } block rounded-lg px-3 py-2 text-base font-semibold hover:bg-blue-50 hover:text-blue-600`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              آگهی‌ها
            </Link>
            <Link
              href='/family-finder'
              className={`${
                pathname === '/family-finder' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              } block rounded-lg px-3 py-2 text-base font-semibold hover:bg-blue-50 hover:text-blue-600`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              پیشنهاد محله
            </Link>
            <Link
              href='/properties/saved'
              className={`${
                pathname === '/properties/saved' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              } block rounded-lg px-3 py-2 text-base font-semibold hover:bg-blue-50 hover:text-blue-600`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ذخیره‌شده‌ها
            </Link>
            <div className='px-3 py-2'>
              <AirQualityBadge />
            </div>
            {status !== 'loading' &&
              (session ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className='text-gray-600 block rounded-lg px-3 py-2 text-base font-semibold hover:bg-gray-100 w-full text-right'
                >
                  خروج ({session.user.phone})
                </button>
              ) : (
                <Link
                  href='/login'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='text-blue-600 block rounded-lg px-3 py-2 text-base font-semibold hover:bg-blue-50'
                >
                  ورود
                </Link>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
