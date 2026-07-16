const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-100 border-t border-gray-200 py-4' dir='rtl'>
      <div className='container mx-auto flex flex-col md:flex-row items-center justify-between px-4'>
        <div className='mb-2 md:mb-0'>
          <span className='text-blue-700 text-xl font-bold'>زمین</span>
        </div>
        <div>
          <p className='text-sm text-gray-500 mt-1 md:mt-0'>
            &copy; {currentYear} زمین. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
