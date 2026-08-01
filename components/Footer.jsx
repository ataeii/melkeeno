const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-cream-dark border-t border-cream-dark py-6' dir='rtl'>
      <div className='container mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-2'>
        <span className='text-navy-800 text-xl font-extrabold tracking-tight'>ملکینو</span>
        <p className='text-sm text-gray-400'>
          &copy; {currentYear} ملکینو. تمامی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
