import PropertySearchForm from './PropertySearchForm';

const Hero = () => {
  return (
    <section className='relative overflow-hidden bg-gradient-to-b from-blue-700 to-blue-900 pt-16 pb-24 sm:pt-20 sm:pb-28'>
      {/* Subtle decorative pattern */}
      <div
        className='absolute inset-0 opacity-10'
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className='relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center'>
        <h1 className='text-4xl font-extrabold text-white sm:text-5xl md:text-6xl leading-tight'>
          خانه رویایی خود را با <span className='text-blue-200'>ملکینو</span> پیدا کنید
        </h1>
        <p className='mt-4 text-lg text-blue-100 sm:text-xl max-w-2xl'>
          جستجوی هزاران آگهی خرید و اجاره ملک در سراسر ایران، در یک نگاه
        </p>

        <div className='mt-8 w-full'>
          <PropertySearchForm />
        </div>
      </div>
    </section>
  );
};
export default Hero;
