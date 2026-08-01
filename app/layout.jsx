import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { ToastContainer } from 'react-toastify';
import '@/assets/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

const DOMAIN = 'https://melkeeno.ir';

export const metadata = {
  metadataBase: new URL(DOMAIN),
  title: 'زمین | جستجوی ملک در ایران',
  description: 'جستجوی ملک، آپارتمان و زمین در سراسر ایران',
  keywords: 'ملک، آپارتمان، اجاره، خرید، زمین، مسکن',
  openGraph: {
    siteName: 'ملکینو',
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
  name: 'ملکینو',
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
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
};
export default MainLayout;
