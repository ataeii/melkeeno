'use client';
import { useState } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FaArrowRight, FaArrowLeft, FaMagic } from 'react-icons/fa';
import { computeSummary, LOAN_TERMS_AS_OF, TSE_CEILING, TSE_RATE, TSE_YEARS, BOND_COST_RATIO, RAHN_RATE } from '@/lib/financePlan';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

const initialForm = {
  maritalStatus: 'single', // single | married | about_to_marry
  city: 'tehran', // tehran | other_center | small_city
  incomeSelf: '',
  incomeSpouse: '',
  incomeOther: '',
  cash: '',
  goldSilverValue: '',
  otherProperty: '',
  car: '',
  otherInvestments: '',
  existingDebtPayments: '',
  monthlyExpenses: '',
  isRentingNow: false,
  currentRent: '',
  goalType: 'buy', // buy | rent | undecided
  targetPrice: '',
  timelineYears: '3',
  priceGrowth: '',
  weddingCost: '',
};

// Persian digits throughout the results (the page used to mix «100 میلیون»
// Latin digits into Persian text).
const fa = (n, digits = 0) =>
  Number(n).toLocaleString('fa-IR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

const fmtToman = (n) => {
  if (n == null || isNaN(n)) return '—';
  const v = Math.round(n);
  if (Math.abs(v) >= 1e9) return fa(v / 1e9, 2) + ' میلیارد تومان';
  if (Math.abs(v) >= 1e6) return fa(v / 1e6) + ' میلیون تومان';
  return fa(v) + ' تومان';
};

const pct = (x) => (x == null ? '—' : `${fa(Math.round(x * 100))}٪`);

// Loan programmes shown with every result. The تسه figures come from
// lib/financePlan.js (sourced, dated); the rest are approximate ballparks
// that change often by circular, always shown with a "verify" note.
function getApplicablePrograms(maritalStatus, city) {
  const tse = TSE_CEILING[city];
  const couple = maritalStatus !== 'single';
  const programs = [
    {
      name: couple ? 'وام خرید مسکن با اوراق تسه (زوجین)' : 'وام خرید مسکن با اوراق تسه (فردی)',
      note: `سقف ${fmtToman(couple ? tse.couple : tse.single)}، سود ${fa(TSE_RATE * 100, 1)} درصد، بازپرداخت تا ${fa(TSE_YEARS)} سال (ارقام ${LOAN_TERMS_AS_OF}). خرید اوراق لازم حدود ${fa(BOND_COST_RATIO * 100)}٪ مبلغ وام هزینه دارد و قیمت اوراق روزانه در بورس تغییر می‌کند.`,
    },
  ];

  if (couple) {
    programs.push({
      name: 'وام ازدواج',
      note: 'سقف تقریبی ۳۰۰ میلیون تومان برای هر نفر (تا ۳۵۰ میلیون برای زوج‌های جوان‌تر)، حدود ۶۰۰ میلیون تومان برای زوجین، بازپرداخت ده‌ساله. معمولاً نوبت‌دهی دارد؛ زمان انتظار متغیر است.',
    });
    programs.push({
      name: 'وام ۴٪ ویژه تازه‌ازدواج‌کرده‌ها / خانواده دارای فرزند',
      note: 'سقف تقریبی ۴۰۰ میلیون تومان، سود ۴ درصد، بازپرداخت ده‌ساله، از طریق بانک‌های ملی، صادرات، تجارت و پست بانک — مشروط به نداشتن ملک دیگر.',
    });
  }

  programs.push({
    name: 'وام ودیعه مسکن (برای مستأجران)',
    note: 'طبق گزارش‌های ۱۴۰۵، سقف حدود ۳۶۵ میلیون تومان در تهران با سود حدود ۲۳ درصد — برای تأمین بخشی از رهن خانه‌ی اجاره‌ای.',
  });
  programs.push({
    name: 'نهضت ملی مسکن',
    note: 'سقف تسهیلات تقریبی ۸۵۰ میلیون تومان (متغیر بر اساس شهر و طرح)، از طریق ثبت‌نام در سامانه ملی مسکن.',
  });
  programs.push({
    name: 'وام قرض‌الحسنه عمومی',
    note: 'برای هزینه‌های جانبی مثل ودیعه یا اثاث‌کشی — معمولاً ۵۰ تا ۵۰۰ میلیون تومان بسته به بانک و سابقه حساب.',
  });

  return programs;
}

// Text input rather than type="number": number inputs silently reject
// Persian digits (۲۰۰) in most browsers, leaving the field empty for anyone
// on a Persian keyboard. lib/financePlan's parseAmount handles both.
const AmountInput = ({ value, onChange, placeholder }) => (
  <input
    type='text'
    inputMode='decimal'
    dir='ltr'
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`${inputClass} text-right`}
  />
);

const STEP_TITLES = ['وضعیت شما', 'درآمد', 'دارایی‌ها', 'بدهی و هزینه‌ها', 'هدف شما', 'نتیجه'];

const FinancePage = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [summary, setSummary] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [loadingNarrative, setLoadingNarrative] = useState(false);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const next = () => {
    if (step === STEP_TITLES.length - 2) {
      setSummary({ ...computeSummary(form), applicablePrograms: getApplicablePrograms(form.maritalStatus, form.city) });
      setNarrative(null); // inputs may have changed since the last analysis
    }
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const getNarrative = async () => {
    if (!summary) return;
    setLoadingNarrative(true);
    try {
      const maritalStatusLabel = { single: 'مجرد', married: 'متاهل', about_to_marry: 'در آستانه ازدواج' }[
        form.maritalStatus
      ];
      const cityLabel = { tehran: 'تهران', other_center: 'مرکز استان یا شهر بالای ۲۰۰ هزار نفر', small_city: 'شهر کوچک‌تر' }[
        form.city
      ];
      const goalLabel = { buy: 'خرید خانه', rent: 'اجاره خانه', undecided: 'هنوز مردد بین اجاره و خرید' }[
        form.goalType
      ];

      const res = await fetch('/api/finance-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...summary, maritalStatusLabel, cityLabel, goalLabel }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'خطایی رخ داد');
        return;
      }
      setNarrative(data.narrative);
    } catch (error) {
      console.log(error);
      toast.error('خطا در تولید تحلیل هوشمند');
    } finally {
      setLoadingNarrative(false);
    }
  };

  return (
    <section dir='rtl' className='max-w-3xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-extrabold text-navy-800 mb-2'>برنامه‌ریز مالی خانه</h1>
      <p className='text-gray-500 text-sm mb-1'>
        با پاسخ به چند سوال، وضعیت مالی خودتان را برای اجاره یا خرید خانه بسنجید. محاسبه‌ها در همین مرورگر انجام
        می‌شود و چیزی ذخیره نمی‌شود؛ فقط اگر «تحلیل شخصی‌سازی‌شده» را بخواهید، خلاصه‌ی ارقام (بدون نام یا مشخصات
        شما) برای تولید متن به یک سرویس هوش مصنوعی فرستاده می‌شود.
      </p>
      <p className='text-blue-600 text-xs font-semibold mb-4'>
        همه‌ی ارقام را به میلیون تومان وارد کنید — مثلاً برای ۲۰۰ میلیون تومان، فقط عدد ۲۰۰ را بنویسید.
      </p>

      {/* Step indicator */}
      <div className='flex items-center gap-1 mb-6 text-xs text-gray-400'>
        {STEP_TITLES.map((t, i) => (
          <span key={t} className={`px-2 py-1 rounded-full ${i === step ? 'bg-blue-50 text-blue-600 font-bold' : ''}`}>
            {t}
            {i < STEP_TITLES.length - 1 && <span className='mx-1'>›</span>}
          </span>
        ))}
      </div>

      <div className='bg-white rounded-xl border border-gray-100 shadow-sm p-6'>
        {step === 0 && (
          <div className='flex flex-col gap-4'>
            <div>
              <label className={labelClass}>وضعیت تاهل</label>
              <div className='flex gap-2'>
                {[
                  { v: 'single', l: 'مجرد' },
                  { v: 'married', l: 'متاهل' },
                  { v: 'about_to_marry', l: 'در آستانه ازدواج' },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type='button'
                    onClick={() => set('maritalStatus')(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      form.maritalStatus === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>شهر</label>
              <div className='flex gap-2'>
                {[
                  { v: 'tehran', l: 'تهران' },
                  { v: 'other_center', l: 'مرکز استان / شهر بزرگ' },
                  { v: 'small_city', l: 'شهر کوچک‌تر' },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type='button'
                    onClick={() => set('city')(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      form.city === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className={labelClass}>درآمد ماهانه شما (میلیون تومان)</label>
              <AmountInput value={form.incomeSelf} onChange={set('incomeSelf')} placeholder='مثلاً ۲۰' />
            </div>
            {form.maritalStatus !== 'single' && (
              <div>
                <label className={labelClass}>درآمد ماهانه همسر (میلیون تومان)</label>
                <AmountInput value={form.incomeSpouse} onChange={set('incomeSpouse')} placeholder='مثلاً ۱۵' />
              </div>
            )}
            <div>
              <label className={labelClass}>سایر درآمدها (میلیون تومان) — اجاره، فریلنسری و ...</label>
              <AmountInput value={form.incomeOther} onChange={set('incomeOther')} placeholder='مثلاً ۵' />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className={labelClass}>پول نقد و پس‌انداز (میلیون تومان)</label>
              <AmountInput value={form.cash} onChange={set('cash')} placeholder='مثلاً ۲۰۰' />
            </div>
            <div>
              <label className={labelClass}>ارزش طلا و نقره (میلیون تومان)</label>
              <AmountInput value={form.goldSilverValue} onChange={set('goldSilverValue')} placeholder='مثلاً ۱۰۰' />
            </div>
            <div>
              <label className={labelClass}>ارزش ملک دیگر (میلیون تومان)</label>
              <AmountInput value={form.otherProperty} onChange={set('otherProperty')} placeholder='مثلاً ۰' />
            </div>
            <div>
              <label className={labelClass}>ارزش خودرو (میلیون تومان)</label>
              <AmountInput value={form.car} onChange={set('car')} placeholder='مثلاً ۵۰۰' />
            </div>
            <div className='sm:col-span-2'>
              <label className={labelClass}>سایر سرمایه‌گذاری‌ها (میلیون تومان) — سهام، ارز دیجیتال و ...</label>
              <AmountInput value={form.otherInvestments} onChange={set('otherInvestments')} placeholder='مثلاً ۰' />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className='flex flex-col gap-4'>
            <div>
              <label className={labelClass}>اقساط بدهی فعلی در ماه (میلیون تومان) — وام، چک و ...</label>
              <AmountInput value={form.existingDebtPayments} onChange={set('existingDebtPayments')} placeholder='مثلاً ۱۰' />
            </div>
            <div>
              <label className={labelClass}>
                هزینه‌های ماهانه زندگی (میلیون تومان) — خوراک، حمل‌ونقل، قبوض و ...، بدون اجاره
              </label>
              <AmountInput value={form.monthlyExpenses} onChange={set('monthlyExpenses')} placeholder='مثلاً ۱۵' />
            </div>
            <label className='flex items-center gap-2 text-sm text-gray-600'>
              <input type='checkbox' checked={form.isRentingNow} onChange={set('isRentingNow')} />
              در حال حاضر مستأجر هستم
            </label>
            {form.isRentingNow && (
              <div>
                <label className={labelClass}>اجاره فعلی (میلیون تومان در ماه)</label>
                <AmountInput value={form.currentRent} onChange={set('currentRent')} placeholder='مثلاً ۲۰' />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className='flex flex-col gap-4'>
            <div>
              <label className={labelClass}>هدف شما</label>
              <div className='flex gap-2'>
                {[
                  { v: 'buy', l: 'خرید خانه' },
                  { v: 'rent', l: 'اجاره خانه' },
                  { v: 'undecided', l: 'هنوز مردد هستم' },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type='button'
                    onClick={() => set('goalType')(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      form.goalType === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {(form.goalType === 'buy' || form.goalType === 'undecided') && (
              <div>
                <label className={labelClass}>قیمت تقریبی خانه‌ی مدنظر (میلیون تومان)</label>
                <AmountInput value={form.targetPrice} onChange={set('targetPrice')} placeholder='مثلاً ۳۰۰۰' />
              </div>
            )}
            <div>
              <label className={labelClass}>افق زمانی (چند سال دیگر)</label>
              <AmountInput value={form.timelineYears} onChange={set('timelineYears')} placeholder='مثلاً ۳' />
            </div>
            {(form.goalType === 'buy' || form.goalType === 'undecided') && (
              <div>
                <label className={labelClass}>رشد سالانه‌ی قیمت مسکن به نظر شما (درصد، اختیاری)</label>
                <AmountInput value={form.priceGrowth} onChange={set('priceGrowth')} placeholder='مثلاً ۳۰' />
                <p className='text-[11px] text-gray-400 mt-1'>
                  اگر خالی بگذارید، قیمت خانه ثابت فرض می‌شود — در بازاری که قیمت‌ها هر سال بالا می‌رود، زمان
                  واقعی رسیدن به خرید بیشتر خواهد بود.
                </p>
              </div>
            )}
            {form.maritalStatus === 'about_to_marry' && (
              <div>
                <label className={labelClass}>هزینه تخمینی ازدواج (میلیون تومان، اختیاری)</label>
                <AmountInput value={form.weddingCost} onChange={set('weddingCost')} placeholder='مثلاً ۵۰۰' />
              </div>
            )}
          </div>
        )}

        {step === 5 && summary && (
          <div className='flex flex-col gap-5'>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              {[
                ['درآمد ماهانه خانوار', fmtToman(summary.totalMonthlyIncome)],
                ['ارزش خالص دارایی', fmtToman(summary.netWorth)],
                ['توان پس‌انداز ماهانه', fmtToman(summary.monthlySavingsCapacity)],
                ['حداکثر اجاره توصیه‌شده', fmtToman(summary.rentAffordability.recommendedMaxRent)],
                ['حداکثر قسط مسکن توصیه‌شده', fmtToman(summary.dti.maxRecommendedHousingPayment)],
              ].map(([label, val]) => (
                <div key={label} className='bg-gray-50 rounded-lg p-3'>
                  <div className='text-xs text-gray-400 mb-1'>{label}</div>
                  <div className='text-sm font-bold text-navy-800'>{val}</div>
                </div>
              ))}
            </div>

            {summary.monthlySavingsCapacity <= 0 && (
              <p className='bg-red-50 text-red-700 text-xs rounded-lg p-3'>
                با این ارقام، هزینه‌های ماهانه‌ی شما از درآمدتان بیشتر یا با آن برابر است؛ پیش از هر برنامه‌ای برای خرید یا
                رهن، کم‌کردن هزینه‌ها یا افزایش درآمد در اولویت است.
              </p>
            )}
            {summary.weddingCost > 0 && (
              <p className='text-xs text-gray-500'>
                {fmtToman(summary.weddingCost)} برای هزینه‌ی ازدواج از دارایی نقد کنار گذاشته شد؛ نقدینگی قابل استفاده
                برای مسکن: {fmtToman(summary.liquidAssets)}.
              </p>
            )}

            {(form.goalType === 'buy' || form.goalType === 'undecided') && summary.targetPrice > 0 && (
              <div className='bg-blue-50 rounded-lg p-4 text-xs text-gray-700 flex flex-col gap-1.5'>
                <h3 className='font-bold text-gray-800 text-sm'>سناریوی خرید (وام اوراق تسه، ارقام {LOAN_TERMS_AS_OF})</h3>
                <p>مبلغ وام: {fmtToman(summary.buy.loanAmount)} — سقف وام شما {fmtToman(summary.buy.ceiling)}</p>
                <p>پیش‌پرداخت نقدی: {fmtToman(summary.buy.downPayment)}</p>
                <p>
                  هزینه‌ی خرید اوراق تسه: حدود {fmtToman(summary.buy.bondCost)} (قیمت اوراق روزانه تغییر می‌کند)
                </p>
                <p className='font-bold'>کل پول نقد لازم: {fmtToman(summary.buy.cashNeeded)}</p>
                <p>
                  قسط ماهانه: حدود {fmtToman(summary.buy.installment)} ({pct(summary.buy.installmentShare)} درآمد خانوار،
                  با سود {fa(TSE_RATE * 100, 1)}٪ و بازپرداخت {fa(TSE_YEARS)} ساله)
                </p>
                <p className={summary.buy.fitsHousingRule && summary.buy.fitsTotalDebtRule ? 'text-green-700' : 'text-red-700'}>
                  {summary.buy.fitsHousingRule && summary.buy.fitsTotalDebtRule
                    ? 'این قسط در محدوده‌ی توصیه‌شده (حداکثر ۲۸٪ درآمد برای مسکن و ۳۶٪ برای کل بدهی‌ها) است.'
                    : !summary.buy.fitsHousingRule
                    ? `این قسط از سقف توصیه‌شده‌ی ${fmtToman(summary.dti.maxRecommendedHousingPayment)} (۲۸٪ درآمد) بیشتر است و فشار زیادی به بودجه می‌آورد.`
                    : 'قسط مسکن به‌تنهایی قابل تحمل است، اما همراه با اقساط فعلی از ۳۶٪ درآمد بیشتر می‌شود.'}
                </p>
                <p>بعد از خرید، از درآمد ماهانه پس از هزینه‌ها و اقساط، حدود {fmtToman(summary.buy.monthlyLeftAfterBuying)} باقی می‌ماند.</p>
                <p className='font-semibold'>
                  {summary.buy.alreadyAffordable
                    ? 'همین حالا پول نقد کافی برای پیش‌پرداخت و اوراق را دارید.'
                    : summary.buy.monthsToAfford == null
                    ? 'با توان پس‌انداز فعلی، رسیدن به این مبلغ در ۳۰ سال آینده ممکن نیست.'
                    : `با روند فعلی پس‌انداز${summary.buy.annualGrowth ? ` و رشد سالانه‌ی ${fa(summary.buy.annualGrowth * 100)}٪ قیمت` : ''}، حدود ${fa(Math.ceil(summary.buy.monthsToAfford))} ماه (${fa(summary.buy.monthsToAfford / 12, 1)} سال) تا رسیدن به پول نقد لازم فاصله دارید — ${summary.buy.withinTimeline ? 'یعنی در افق زمانی که تعیین کرده‌اید.' : 'یعنی بیشتر از افق زمانی که تعیین کرده‌اید.'}`}
                </p>
              </div>
            )}

            {(form.goalType === 'rent' || form.goalType === 'undecided') && (
              <div className='bg-amber-50 rounded-lg p-4 text-xs text-gray-700 flex flex-col gap-1.5'>
                <h3 className='font-bold text-gray-800 text-sm'>سناریوی اجاره (رهن و اجاره)</h3>
                <p>حداکثر اجاره‌ی ماهانه‌ی توصیه‌شده (۳۰٪ درآمد): {fmtToman(summary.rent.maxRent)}</p>
                <p>حداکثر رهن با نقدینگی فعلی: {fmtToman(summary.rent.maxDeposit)}</p>
                <p>
                  با قاعده‌ی رایج تبدیل رهن به اجاره ({fa(RAHN_RATE * 100)}٪ در ماه)، می‌توانید دنبال خانه‌ای باشید
                  که «معادل اجاره‌ی» آن (اجاره + ۳٪ رهن) حداکثر <b>{fmtToman(summary.rent.maxRentEquivalent)}</b> در ماه
                  باشد — مثلاً با گذاشتن همه‌ی نقدینگی به‌عنوان رهن و پرداخت {fmtToman(summary.rent.maxRent)} اجاره.
                </p>
                <Link href='/properties' className='text-blue-700 font-semibold hover:underline'>
                  دیدن آگهی‌های اجاره و تحلیل قیمت منصفانه‌ی هر کدام ←
                </Link>
              </div>
            )}

            <div>
              <h3 className='font-bold text-gray-800 mb-2 text-sm'>تسهیلات قابل بررسی (ارقام تقریبی)</h3>
              <div className='flex flex-col gap-2'>
                {summary.applicablePrograms.map((p) => (
                  <div key={p.name} className='bg-gray-50 rounded-lg p-3'>
                    <div className='text-sm font-semibold text-gray-800'>{p.name}</div>
                    <div className='text-xs text-gray-500 mt-0.5'>{p.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {!narrative ? (
              <button
                onClick={getNarrative}
                disabled={loadingNarrative}
                className='w-full flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-900 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors'
              >
                <FaMagic />
                {loadingNarrative ? 'در حال تحلیل... (تا ۲۰ ثانیه طول می‌کشد)' : 'تحلیل شخصی‌سازی‌شده بگیر'}
              </button>
            ) : (
              <div className='bg-cream rounded-lg p-4 whitespace-pre-line text-sm text-gray-700 leading-relaxed'>
                {narrative}
              </div>
            )}
            <p className='text-[11px] text-gray-400 text-center'>
              همه‌ی ارقام تقریبی هستند و صرفاً برای برنامه‌ریزی اولیه‌اند — پیش از تصمیم‌گیری نهایی حتماً شرایط دقیق را
              با بانک یا مرجع رسمی چک کنید.
            </p>
          </div>
        )}

        {/* Nav buttons */}
        <div className='flex items-center justify-between mt-6 pt-4 border-t border-gray-100'>
          <button
            onClick={back}
            disabled={step === 0}
            className='flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30'
          >
            <FaArrowRight /> قبلی
          </button>
          {step < STEP_TITLES.length - 1 && (
            <button
              onClick={next}
              className='flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors'
            >
              بعدی <FaArrowLeft />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FinancePage;
