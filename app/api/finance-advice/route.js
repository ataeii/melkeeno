import { generateFinanceNarrative } from '@/lib/gemini';
import connectDB from '@/config/database';
import ApiUsage from '@/models/ApiUsage';

export const dynamic = 'force-dynamic';

const DAILY_LIMIT = Number(process.env.GEMINI_DAILY_LIMIT) || 50;

// Atomically bumps today's counter and reports whether this call is still
// within budget. Keyed by date so it resets on its own every day with no
// cron job, and survives pm2 restarts since it lives in Mongo rather than
// in-process memory.
async function tryConsumeDailyQuota() {
  await connectDB();
  const today = new Date().toISOString().slice(0, 10);
  const usage = await ApiUsage.findOneAndUpdate(
    { key: `gemini:${today}` },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
  return usage.count <= DAILY_LIMIT;
}

const fmt = (n) => (n == null ? 'نامشخص' : Math.round(n).toLocaleString('en-US'));

function buildPrompt(s) {
  const lines = [];

  lines.push('تو یک مشاور مالی دلسوز و صادق برای یک خانواده یا فرد ایرانی هستی که می‌خواهد بین اجاره و خرید خانه تصمیم بگیرد.');
  lines.push('فقط از ارقامی که در زیر داده شده استفاده کن — هیچ عدد جدیدی (قیمت وام، نرخ سود، قیمت طلا و ...) از خودت اختراع نکن.');
  lines.push('پاسخ را به فارسی، صمیمی و کاربردی بنویس، حدود ۳۵۰ تا ۵۰۰ کلمه، با این بخش‌ها:');
  lines.push(
    'مهم: خروجی را به صورت متن ساده بنویس، بدون استفاده از نشانه‌های مارک‌داون مثل ### یا ** یا -. برای عنوان هر بخش فقط از خود متن عنوان استفاده کن و بعدش یک خط خالی بگذار، بدون هیچ نماد اضافه.'
  );
  lines.push('۱. خلاصه‌ی وضعیت فعلی (یک پاراگراف کوتاه)');
  lines.push('۲. مقایسه‌ی اجاره در برابر خرید برای این فرد به طور مشخص');
  lines.push('۳. وام‌ها و تسهیلاتی که با توجه به وضعیت تاهل و شرایطش به او پیشنهاد می‌شود، دقیقاً با همان ارقام تقریبی داده‌شده و با یادآوری اینکه شرایط را حتماً با بانک/مرجع رسمی چک کند');
  lines.push('۴. سه قدم عملی و مشخص بعدی که همین الان می‌تواند بردارد');
  lines.push('لحن باید امیدوارکننده و واقع‌بین باشد، نه نگران‌کننده. از تیتر برای هر بخش استفاده کن.');
  lines.push('');
  lines.push('--- اطلاعات فرد ---');
  lines.push(`وضعیت تاهل: ${s.maritalStatusLabel}`);
  lines.push(`شهر: ${s.cityLabel}`);
  lines.push(`هدف: ${s.goalLabel}`);
  lines.push(`درآمد ماهانه خانوار: ${fmt(s.totalMonthlyIncome)} تومان`);
  lines.push(`هزینه‌های ماهانه (بدون اجاره): ${fmt(s.monthlyExpenses)} تومان`);
  if (s.currentRent) lines.push(`اجاره فعلی: ${fmt(s.currentRent)} تومان در ماه`);
  lines.push(`اقساط بدهی فعلی: ${fmt(s.existingDebtPayments)} تومان در ماه`);
  lines.push(`توان پس‌انداز ماهانه: ${fmt(s.monthlySavingsCapacity)} تومان`);
  lines.push(`ارزش خالص دارایی‌ها: ${fmt(s.netWorth)} تومان`);
  lines.push(`دارایی نقدشونده قابل استفاده برای مسکن (نقد + طلا/نقره): ${fmt(s.liquidAssets)} تومان`);
  if (s.weddingCost) lines.push(`هزینه تخمینی ازدواج (از نقدینگی بالا کسر شده): ${fmt(s.weddingCost)} تومان`);
  if (s.monthlySavingsCapacity != null && s.monthlySavingsCapacity <= 0)
    lines.push('هشدار: هزینه‌های ماهانه برابر یا بیشتر از درآمد است — این را صریح و دلسوزانه مطرح کن.');
  lines.push('');
  lines.push('--- تحلیل انجام‌شده (قانون ۲۸/۳۶) ---');
  lines.push(`حداکثر پرداخت مسکن توصیه‌شده (۲۸٪ درآمد): ${fmt(s.dti.maxRecommendedHousingPayment)} تومان در ماه`);
  lines.push(`حداکثر کل بدهی توصیه‌شده (۳۶٪ درآمد): ${fmt(s.dti.maxRecommendedTotalDebt)} تومان در ماه`);
  lines.push(`حداکثر اجاره توصیه‌شده (۳۰٪ درآمد): ${fmt(s.rentAffordability.recommendedMaxRent)} تومان در ماه`);
  const b = s.buy || {};
  if ((s.goalType === 'buy' || s.goalType === 'undecided') && s.targetPrice > 0) {
    lines.push('');
    lines.push('--- سناریوی خرید (وام اوراق تسه بانک مسکن) ---');
    lines.push(`قیمت هدف ملک: ${fmt(s.targetPrice)} تومان`);
    lines.push(`مبلغ وام: ${fmt(b.loanAmount)} تومان (سقف: ${fmt(b.ceiling)})`);
    lines.push(`پیش‌پرداخت نقدی: ${fmt(b.downPayment)} تومان`);
    lines.push(`هزینه‌ی خرید اوراق تسه (تقریبی، روزانه تغییر می‌کند): ${fmt(b.bondCost)} تومان`);
    lines.push(`کل پول نقد لازم: ${fmt(b.cashNeeded)} تومان`);
    lines.push(`قسط ماهانه‌ی وام: ${fmt(b.installment)} تومان (${b.installmentShare != null ? Math.round(b.installmentShare * 100) : 'نامشخص'}٪ درآمد)`);
    lines.push(`قسط در محدوده‌ی ۲۸٪ درآمد: ${b.fitsHousingRule ? 'بله' : 'خیر'} — کل بدهی در محدوده‌ی ۳۶٪: ${b.fitsTotalDebtRule ? 'بله' : 'خیر'}`);
    lines.push(`مانده‌ی ماهانه پس از خرید: ${fmt(b.monthlyLeftAfterBuying)} تومان`);
    // monthsToAfford: 0 = already enough cash, null = not reachable (JSON
    // turns Infinity into null -- it used to be read here as "0 months").
    lines.push(
      b.alreadyAffordable
        ? 'نقدینگی فعلی برای پیش‌پرداخت و اوراق کافی است.'
        : b.monthsToAfford == null
        ? 'با توان پس‌انداز فعلی، رسیدن به پول نقد لازم در ۳۰ سال آینده ممکن نیست.'
        : `با توان پس‌انداز فعلی${b.annualGrowth ? ` و رشد سالانه‌ی ${Math.round(b.annualGrowth * 100)}٪ قیمت مسکن` : ' (با فرض ثابت ماندن قیمت)'}، حدود ${Math.ceil(b.monthsToAfford)} ماه تا رسیدن به پول نقد لازم فاصله دارد؛ ${b.withinTimeline ? 'در افق زمانی مدنظرش' : 'بیشتر از افق زمانی مدنظرش'} (${Math.round((s.timelineMonths || 0) / 12)} سال).`
    );
  }
  const r = s.rent || {};
  if (s.goalType === 'rent' || s.goalType === 'undecided') {
    lines.push('');
    lines.push('--- سناریوی اجاره (رهن و اجاره، تبدیل ۳٪ ماهانه) ---');
    lines.push(`حداکثر رهن با نقدینگی فعلی: ${fmt(r.maxDeposit)} تومان`);
    lines.push(`حداکثر «معادل اجاره» قابل تحمل (اجاره + ۳٪ رهن): ${fmt(r.maxRentEquivalent)} تومان در ماه`);
  }
  lines.push('');
  lines.push('--- تسهیلات قابل بررسی (ارقام تقریبی ۱۴۰۵، حتماً با بانک/مرجع رسمی چک شود) ---');
  s.applicablePrograms.forEach((p) => lines.push(`- ${p.name}: ${p.note}`));

  return lines.join('\n');
}

export const POST = async (request) => {
  try {
    const summary = await request.json();
    if (!summary || typeof summary !== 'object') {
      return new Response(JSON.stringify({ message: 'ورودی نامعتبر است' }), { status: 400 });
    }

    const withinQuota = await tryConsumeDailyQuota();
    if (!withinQuota) {
      return new Response(
        JSON.stringify({ message: 'امروز به سقف تحلیل‌های هوشمند رسیده‌ایم، لطفاً فردا دوباره امتحان کنید.' }),
        { status: 429 }
      );
    }

    const prompt = buildPrompt(summary);
    const narrative = await generateFinanceNarrative(prompt);

    return new Response(JSON.stringify({ narrative }), { status: 200 });
  } catch (error) {
    console.log('[finance-advice]', error.message);
    return new Response(JSON.stringify({ message: 'خطا در تولید تحلیل هوشمند' }), { status: 500 });
  }
};
