'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className='bg-blue-700 border-b border-blue-500'>
      <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
        <div className='relative flex h-16 items-center justify-between' dir='rtl'>
          {/* Mobile menu button */}
          <div className='absolute inset-y-0 right-0 flex items-center md:hidden'>
            <button
              type='button'
              id='mobile-dropdown-button'
              className='relative inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:bg-blue-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
              aria-controls='mobile-menu'
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span className='sr-only'>باز کردن منو</span>
              <svg
                className='block h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                />
              </svg>
            </button>
          </div>

          {/* Logo + desktop nav */}
          <div className='flex flex-1 items-center justify-start md:items-stretch md:justify-start'>
            <Link className='flex flex-shrink-0 items-center' href='/'>
              <span className='text-white text-2xl font-bold tracking-wide'>زمین</span>
            </Link>

            {/* Desktop Menu */}
            <div className='hidden md:mr-6 md:block'>
              <div className='flex gap-1'>
                <Link
                  href='/properties'
                  className={`${
                    pathname === '/properties' ? 'bg-blue-900' : ''
                  } text-white hover:bg-blue-800 hover:text-white rounded-md px-4 py-2 text-sm font-medium`}
                >
                  آگهی‌ها
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop auth */}
          <div className='hidden md:flex md:items-center'>
            {status !== 'loading' &&
              (session ? (
                <div className='flex items-center gap-3'>
                  <span className='text-white text-sm'>{session.user.phone}</span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className='text-white hover:bg-blue-800 hover:text-white rounded-md px-4 py-2 text-sm font-medium'
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <Link
                  href='/login'
                  className='text-white hover:bg-blue-800 hover:text-white rounded-md px-4 py-2 text-sm font-medium'
                >
                  ورود
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div id='mobile-menu' dir='rtl'>
          <div className='space-y-1 px-3 pb-3 pt-2'>
            <Link
              href='/properties'
              className={`${
                pathname === '/properties' ? 'bg-blue-900' : ''
              } text-white block rounded-md px-3 py-2 text-base font-medium hover:bg-blue-800`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              آگهی‌ها
            </Link>
            {status !== 'loading' &&
              (session ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className='text-white block rounded-md px-3 py-2 text-base font-medium hover:bg-blue-800 w-full text-right'
                >
                  خروج ({session.user.phone})
                </button>
              ) : (
                <Link
                  href='/login'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='text-white block rounded-md px-3 py-2 text-base font-medium hover:bg-blue-800'
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
