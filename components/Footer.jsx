const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-50 border-t border-gray-100 py-6' dir='rtl'>
      <div className='container mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-2'>
        <span className='text-blue-600 text-xl font-extrabold tracking-tight'>ملکینو</span>
        <p className='text-sm text-gray-400'>
          &copy; {currentYear} ملکینو. تمامی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
