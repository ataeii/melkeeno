'use client';

// KBB-style "where does this price fall" meter. Position is driven by the
// ratio of the listing's own price to the comp-based typical price, on a
// fixed -50%..+50% window -- kept in sync with price_analysis.py's
// FAIR_BAND (+-15%) for the green/amber/red zone edges (35% / 65%).
const WINDOW = 0.5; // ratio window shown: typical*(1-WINDOW) .. typical*(1+WINDOW)
const FAIR_BAND = 0.15;

function positionFor(ratio) {
  const clamped = Math.max(1 - WINDOW, Math.min(1 + WINDOW, ratio));
  return ((clamped - (1 - WINDOW)) / (2 * WINDOW)) * 100;
}

function formatToman(n) {
  if (!n) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + ' میلیارد';
  if (n >= 1e6) return (n / 1e6).toFixed(0) + ' میلیون';
  return n.toLocaleString();
}

const zoneLowPct = positionFor(1 - FAIR_BAND); // 35%
const zoneHighPct = positionFor(1 + FAIR_BAND); // 65%

const gaugeGradient = `linear-gradient(to right, #22c55e 0%, #22c55e ${zoneLowPct}%, #f59e0b ${zoneLowPct}%, #f59e0b ${zoneHighPct}%, #ef4444 ${zoneHighPct}%, #ef4444 100%)`;

const VERDICT_LABEL = {
  below_market: 'زیر قیمت بازار',
  fair: 'قیمت منصفانه',
  above_market: 'بالای قیمت بازار',
};

/**
 * @param {number} ownPrice - the listing's own total price (or rent)
 * @param {object} estimate - { typical, min, max, verdict, verdictPct, confidence, compCount, compPpm2 }
 * @param {'sale'|'rent'} kind
 */
const PriceGauge = ({ ownPrice, estimate, kind = 'sale' }) => {
  if (!estimate || !estimate.typical || !ownPrice) return null;
  const { typical, verdict, verdictPct, confidence, compCount, compPpm2, flag } = estimate;
  const isDecoy = flag === 'decoy';
  const ratio = ownPrice / typical;
  const lowConfidence = confidence === 'low';
  const position = positionFor(ratio);
  const unit = kind === 'rent' ? 'تومان/ماه' : 'تومان';

  return (
    <div className='mb-2 bg-gray-50 rounded-lg px-2.5 py-2'>
      <div className='flex items-center justify-between gap-2 mb-1.5'>
        <span className='text-[11px] text-gray-500'>
          {compPpm2 ? `میانگین منطقه: ${formatToman(compPpm2)} تومان/متر` : 'برآورد قیمت منطقه'}
        </span>
        {!isDecoy && !lowConfidence && verdict && (
          <span
            className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
              verdict === 'below_market'
                ? 'bg-green-50 text-green-700'
                : verdict === 'above_market'
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {VERDICT_LABEL[verdict]}
            {verdict !== 'fair' && verdictPct != null ? ` (${Math.abs(verdictPct)}٪)` : ''}
          </span>
        )}
        {isDecoy && (
          <span className='text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap bg-gray-200 text-gray-600'>
            قیمت نامعتبر؟
          </span>
        )}
      </div>

      {isDecoy ? (
        <p className='text-[10px] text-gray-400'>
          قیمت این آگهی با میانگین منطقه ({formatToman(compPpm2)} تومان/متر) فاصله بسیار زیادی دارد —
          احتمالاً قیمت واقعی برای نمایش در جستجو نیست.
        </p>
      ) : (
        <>
          <div dir='ltr' className='relative h-2 rounded-full' style={{ background: lowConfidence ? '#e5e7eb' : gaugeGradient }}>
            <div
              className='absolute top-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-700 shadow'
              style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
              title={`${formatToman(ownPrice)} ${unit}`}
            />
          </div>

          <div className='flex items-center justify-between mt-1 text-[10px] text-gray-400'>
            <span>{formatToman(typical * (1 - WINDOW))}</span>
            <span>{formatToman(typical)} (میانه)</span>
            <span>{formatToman(typical * (1 + WINDOW))}</span>
          </div>

          {lowConfidence && (
            <p className='text-[10px] text-gray-400 mt-1'>
              برآورد کم‌دقت — داده کافی در این محله نبود، بر پایه میانگین شهر ({compCount} آگهی مشابه)
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default PriceGauge;
