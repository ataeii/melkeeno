import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { BookmarksProvider } from '@/context/BookmarksContext';
import { ToastContainer } from 'react-toastify';
import '@/assets/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

const DOMAIN = 'https://khanedade.ir';

export const metadata = {
  metadataBase: new URL(DOMAIN),
  title: 'خانه‌داده | جستجوی هوشمند ملک در تهران',
  description: 'جست‌وجوی ملک، آپارتمان و زمین در تهران با تحلیل قیمت منصفانه و امکانات محله.',
  keywords: 'ملک، آپارتمان، اجاره، خرید، زمین، مسکن',
  openGraph: {
    siteName: 'خانه‌داده',
    type: 'website',
    locale: 'fa_IR',
    images: ['/images/screen.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      'max-image-preview': 'large',
    },
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'خانه‌داده',
  url: DOMAIN,
};

const MainLayout = ({ children }) => {
  return (
    <html lang='fa' dir='rtl'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&display=swap'
          rel='stylesheet'
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className='bg-cream text-gray-900'>
        <AuthProvider>
          <BookmarksProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ToastContainer />
          </BookmarksProvider>
        </AuthProvider>
      </body>
    </html>
  );
};
export default MainLayout;
