'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { FaBars, FaTimes } from 'react-icons/fa';
import logoIcon from '@/public/images/logo-icon.png';

// Single source of truth for both the desktop and mobile menus -- listed
// separately before (copy-pasted per link) is exactly how "مقالات" ended up
// missing from one of the two menus previously. Order here is the display
// order in both places.
const NAV_LINKS = [
  { href: '/properties', label: 'آگهی‌ها' },
  { href: '/family-finder', label: 'پیشنهاد محله' },
  { href: '/schools', label: 'مدارس' },
  { href: '/articles', label: 'مقالات' },
  { href: '/properties/saved', label: 'ذخیره‌شده‌ها' },
  { href: '/finance', label: 'برنامه‌ریز مالی' },
  { href: '/offices', label: 'دفاتر املاک' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس با ما' },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className='sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-cream-dark shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between min-h-16 gap-4' dir='rtl'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2 flex-shrink-0'>
            <Image src={logoIcon} alt='' width={36} height={36} className='rounded-lg' priority />
            <span className='text-navy-800 text-2xl font-extrabold tracking-tight'>ملکینو</span>
          </Link>

          {/* Nav links -- a single scrollable row rather than wrapping to a
              second line. 7 tabs don't reliably fit one row at normal desktop
              widths; wrapping used to silently push overflow links under the
              logo/auth columns (that's what broke "مقالات" once already).
              A horizontal scroll strip is the standard pattern for this many
              top-level tabs (browser tabs, GitHub's PR file tabs, etc.) --
              stays one clean row, degrades gracefully on any width. */}
          <div
            className='hidden md:flex items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden min-w-0'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                } hover:bg-blue-50 hover:text-blue-600 rounded-full px-3 py-2 text-sm font-semibold transition-colors flex-shrink-0 whitespace-nowrap`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className='hidden md:flex items-center gap-2 flex-shrink-0'>
            {status !== 'loading' &&
              (session ? (
                <div className='flex items-center gap-3'>
                  <Link
                    href='/properties/sell'
                    className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap'
                  >
                    ثبت آگهی
                  </Link>
                  <Link
                    href='/profile'
                    className='text-gray-600 hover:text-blue-600 text-sm font-semibold transition-colors whitespace-nowrap'
                  >
                    {session.user.firstName ? `${session.user.firstName} ${session.user.lastName || ''}`.trim() : session.user.phone}
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className='text-gray-600 hover:bg-gray-100 rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap'
                  >
                    خروج
                  </button>
                </div>
              ) : (
                <Link
                  href='/login'
                  className='bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap'
                >
                  ورود
                </Link>
              ))}
          </div>

          {/* Mobile menu button */}
          <button
            type='button'
            id='mobile-dropdown-button'
            className='md:hidden inline-flex items-center justify-center rounded-full p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0'
            aria-controls='mobile-menu'
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className='sr-only'>باز کردن منو</span>
            {isMobileMenuOpen ? <FaTimes className='h-5 w-5' /> : <FaBars className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div id='mobile-menu' dir='rtl' className='md:hidden border-t border-gray-100'>
          <div className='space-y-1 px-4 pb-3 pt-2'>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  pathname === link.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                } block rounded-lg px-3 py-2 text-base font-semibold hover:bg-blue-50 hover:text-blue-600`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {status !== 'loading' &&
              (session ? (
                <>
                  <Link
                    href='/properties/sell'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className='block rounded-lg px-3 py-2 text-base font-semibold bg-blue-600 text-white text-center'
                  >
                    ثبت آگهی
                  </Link>
                  <Link
                    href='/profile'
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${
                      pathname === '/profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                    } block rounded-lg px-3 py-2 text-base font-semibold hover:bg-blue-50 hover:text-blue-600`}
                  >
                    پروفایل ({session.user.firstName || session.user.phone})
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className='text-gray-600 block rounded-lg px-3 py-2 text-base font-semibold hover:bg-gray-100 w-full text-right'
                  >
                    خروج ({session.user.firstName || session.user.phone})
                  </button>
                </>
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
