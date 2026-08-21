'use client';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaArrowRight, FaArrowLeft, FaMagic } from 'react-icons/fa';

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
  weddingCost: '',
};

const fmtToman = (n) => {
  if (n == null || isNaN(n)) return '—';
  const v = Math.round(n);
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + ' میلیارد تومان';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(0) + ' میلیون تومان';
  return v.toLocaleString('en-US') + ' تومان';
};

// Approximate 1405 (2026) figures from public/aggregator sources — loan
// ceilings, rates, and queue times change often via central bank circulars,
// so these exist only to give a ballpark and are always shown with a
// "verify with the bank" note, never asserted as exact.
const TSE_CEILING = {
  tehran: { single: 400_000_000, couple: 1_000_000_000 },
  other_center: { single: 320_000_000, couple: 640_000_000 },
  small_city: { single: 240_000_000, couple: 480_000_000 },
};

function getApplicablePrograms(maritalStatus, city) {
  const tse = TSE_CEILING[city];
  const programs = [];

  if (maritalStatus === 'single') {
    programs.push({
      name: 'اوراق تسه بانک مسکن (فردی)',
      note: `سقف تقریبی ${fmtToman(tse.single)} — با خرید اوراق تسهیلات مسکن در بورس و مراجعه به بانک مسکن. قیمت اوراق روزانه در بورس تغییر می‌کند.`,
    });
  } else {
    programs.push({
      name: 'اوراق تسه بانک مسکن (زوجین)',
      note: `سقف تقریبی ${fmtToman(tse.couple)} در صورت ترکیب سهمیه هر دو نفر. قیمت اوراق روزانه در بورس تغییر می‌کند.`,
    });
  }

  if (maritalStatus !== 'single') {
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
    name: 'نهضت ملی مسکن',
    note: 'سقف تسهیلات تقریبی ۸۵۰ میلیون تومان (متغیر بر اساس شهر و طرح)، از طریق ثبت‌نام در سامانه ملی مسکن.',
  });
  programs.push({
    name: 'وام قرض‌الحسنه عمومی',
    note: 'برای هزینه‌های جانبی مثل ودیعه یا اثاث‌کشی — معمولاً ۵۰ تا ۵۰۰ میلیون تومان بسته به بانک و سابقه حساب.',
  });

  return programs;
}

const MILLION = 1_000_000;

function computeSummary(form) {
  // Income fields are entered in millions of toman (e.g. "20" means
  // 20,000,000 toman) — much easier to type than the full figure.
  const incomeSelf = (Number(form.incomeSelf) || 0) * MILLION;
  const incomeSpouse = form.maritalStatus !== 'single' ? (Number(form.incomeSpouse) || 0) * MILLION : 0;
  const incomeOther = (Number(form.incomeOther) || 0) * MILLION;
  const totalMonthlyIncome = incomeSelf + incomeSpouse + incomeOther;

  // All money fields below are entered in millions of toman, same as income.
  const cash = (Number(form.cash) || 0) * MILLION;
  const goldSilverValue = (Number(form.goldSilverValue) || 0) * MILLION;
  const otherProperty = (Number(form.otherProperty) || 0) * MILLION;
  const car = (Number(form.car) || 0) * MILLION;
  const otherInvestments = (Number(form.otherInvestments) || 0) * MILLION;
  const netWorth = cash + goldSilverValue + otherProperty + car + otherInvestments;
  const liquidAssets = cash + goldSilverValue;

  const existingDebtPayments = (Number(form.existingDebtPayments) || 0) * MILLION;
  const monthlyExpenses = (Number(form.monthlyExpenses) || 0) * MILLION;
  const currentRent = form.isRentingNow ? (Number(form.currentRent) || 0) * MILLION : 0;

  const monthlySavingsCapacity = totalMonthlyIncome - monthlyExpenses - existingDebtPayments - currentRent;

  const dti = {
    maxRecommendedHousingPayment: totalMonthlyIncome * 0.28,
    maxRecommendedTotalDebt: totalMonthlyIncome * 0.36,
  };
  const rentAffordability = {
    recommendedMaxRent: totalMonthlyIncome * 0.3,
  };

  const tse = TSE_CEILING[form.city];
  const estimatedLoanAvailable = form.maritalStatus === 'single' ? tse.single : tse.couple;
  const targetPrice = (Number(form.targetPrice) || 0) * MILLION;
  const downPaymentNeeded = Math.max(0, targetPrice - estimatedLoanAvailable);
  const monthsToSaveDownPayment =
    monthlySavingsCapacity > 0 ? Math.max(0, (downPaymentNeeded - liquidAssets) / monthlySavingsCapacity) : Infinity;

  return {
    totalMonthlyIncome,
    netWorth,
    liquidAssets,
    existingDebtPayments,
    monthlyExpenses,
    currentRent,
    monthlySavingsCapacity,
    dti,
    rentAffordability,
    goalType: form.goalType,
    targetPrice,
    weddingCost: (Number(form.weddingCost) || 0) * MILLION,
    buyScenario: { estimatedLoanAvailable, downPaymentNeeded, monthsToSaveDownPayment },
    applicablePrograms: getApplicablePrograms(form.maritalStatus, form.city),
  };
}

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
      setSummary(computeSummary(form));
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
      const cityLabel = { tehran: 'تهران', other_center: 'مرکز استان دیگر', small_city: 'شهر کوچک‌تر' }[form.city];
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
        با پاسخ به چند سوال، وضعیت مالی خودتان را برای اجاره یا خرید خانه بسنجید. هیچ‌کدام از این اطلاعات ذخیره
        نمی‌شود — فقط برای همین محاسبه استفاده می‌شود.
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
                  { v: 'other_center', l: 'مرکز استان دیگر' },
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
              <input
                type='number'
                value={form.incomeSelf}
                onChange={set('incomeSelf')}
                placeholder='مثلاً ۲۰'
                className={inputClass}
              />
            </div>
            {form.maritalStatus !== 'single' && (
              <div>
                <label className={labelClass}>درآمد ماهانه همسر (میلیون تومان)</label>
                <input
                  type='number'
                  value={form.incomeSpouse}
                  onChange={set('incomeSpouse')}
                  placeholder='مثلاً ۱۵'
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>سایر درآمدها (میلیون تومان) — اجاره، فریلنسری و ...</label>
              <input
                type='number'
                value={form.incomeOther}
                onChange={set('incomeOther')}
                placeholder='مثلاً ۵'
                className={inputClass}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className={labelClass}>پول نقد و پس‌انداز (میلیون تومان)</label>
              <input type='number' value={form.cash} onChange={set('cash')} placeholder='مثلاً ۲۰۰' className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ارزش طلا و نقره (میلیون تومان)</label>
              <input
                type='number'
                value={form.goldSilverValue}
                onChange={set('goldSilverValue')}
                placeholder='مثلاً ۱۰۰'
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>ارزش ملک دیگر (میلیون تومان)</label>
              <input
                type='number'
                value={form.otherProperty}
                onChange={set('otherProperty')}
                placeholder='مثلاً ۰'
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>ارزش خودرو (میلیون تومان)</label>
              <input type='number' value={form.car} onChange={set('car')} placeholder='مثلاً ۵۰۰' className={inputClass} />
            </div>
            <div className='sm:col-span-2'>
              <label className={labelClass}>سایر سرمایه‌گذاری‌ها (میلیون تومان) — سهام، ارز دیجیتال و ...</label>
              <input
                type='number'
                value={form.otherInvestments}
                onChange={set('otherInvestments')}
                placeholder='مثلاً ۰'
                className={inputClass}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className='flex flex-col gap-4'>
            <div>
              <label className={labelClass}>اقساط بدهی فعلی در ماه (میلیون تومان) — وام، چک و ...</label>
              <input
                type='number'
                value={form.existingDebtPayments}
                onChange={set('existingDebtPayments')}
                placeholder='مثلاً ۱۰'
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                هزینه‌های ماهانه زندگی (میلیون تومان) — خوراک، حمل‌ونقل، قبوض و ...، بدون اجاره
              </label>
              <input
                type='number'
                value={form.monthlyExpenses}
                onChange={set('monthlyExpenses')}
                placeholder='مثلاً ۱۵'
                className={inputClass}
              />
            </div>
            <label className='flex items-center gap-2 text-sm text-gray-600'>
              <input type='checkbox' checked={form.isRentingNow} onChange={set('isRentingNow')} />
              در حال حاضر مستأجر هستم
            </label>
            {form.isRentingNow && (
              <div>
                <label className={labelClass}>اجاره فعلی (میلیون تومان در ماه)</label>
                <input
                  type='number'
                  value={form.currentRent}
                  onChange={set('currentRent')}
                  placeholder='مثلاً ۲۰'
                  className={inputClass}
                />
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
                <input
                  type='number'
                  value={form.targetPrice}
                  onChange={set('targetPrice')}
                  placeholder='مثلاً ۳۰۰۰'
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>افق زمانی (چند سال دیگر)</label>
              <input type='number' value={form.timelineYears} onChange={set('timelineYears')} className={inputClass} />
            </div>
            {form.maritalStatus === 'about_to_marry' && (
              <div>
                <label className={labelClass}>هزینه تخمینی ازدواج (میلیون تومان، اختیاری)</label>
                <input
                  type='number'
                  value={form.weddingCost}
                  onChange={set('weddingCost')}
                  placeholder='مثلاً ۵۰۰'
                  className={inputClass}
                />
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

            {(form.goalType === 'buy' || form.goalType === 'undecided') && summary.targetPrice > 0 && (
              <div className='bg-blue-50 rounded-lg p-4'>
                <h3 className='font-bold text-gray-800 mb-2 text-sm'>سناریوی خرید</h3>
                <p className='text-xs text-gray-600 mb-1'>
                  سقف تقریبی تسهیلات قابل دریافت: {fmtToman(summary.buyScenario.estimatedLoanAvailable)}
                </p>
                <p className='text-xs text-gray-600 mb-1'>
                  پیش‌پرداخت نقدی مورد نیاز: {fmtToman(summary.buyScenario.downPaymentNeeded)}
                </p>
                <p className='text-xs text-gray-600'>
                  {summary.buyScenario.monthsToSaveDownPayment === Infinity
                    ? 'با توان پس‌انداز فعلی، رسیدن به این پیش‌پرداخت در بازه معقول مشخص نیست'
                    : `با روند فعلی پس‌انداز، حدود ${Math.ceil(summary.buyScenario.monthsToSaveDownPayment)} ماه دیگر لازم است`}
                </p>
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
