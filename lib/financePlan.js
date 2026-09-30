// Pure calculation logic for the /finance planner (kept out of the page so
// it can be tested on its own). All money values are in toman.
//
// Loan terms are Bank Maskan تسه (bond-backed) purchase loans as reported for
// Mehr 1405 (nabzgheymat.ir, 4 Mehr 1405): ceilings below, 22.5% interest,
// up to 12 years' simple repayment. Buying the required bonds costs roughly
// 22% of the loan (≈446.6M toman for a 2B loan at the 29 Shahrivar bond price
// of ≈111,655 toman) -- the bond price moves daily, so this is a ballpark.
// These change by central-bank circular; update LOAN_TERMS_AS_OF with them.
export const LOAN_TERMS_AS_OF = 'مهر ۱۴۰۵';
export const TSE_CEILING = {
  tehran: { single: 1_000_000_000, couple: 2_000_000_000 },
  other_center: { single: 800_000_000, couple: 1_600_000_000 },
  small_city: { single: 600_000_000, couple: 1_200_000_000 },
};
export const TSE_RATE = 0.225;
export const TSE_YEARS = 12;
export const BOND_COST_RATIO = 446_620_000 / 2_000_000_000; // ≈0.223 of the loan

// The site-wide deposit ↔ rent convention (same as price_analysis.py's
// RAHN_RATE): each toman of deposit (رهن) replaces 3% of it in monthly rent.
export const RAHN_RATE = 0.03;

export const MILLION = 1_000_000;

// Persian/Arabic-Indic digits, Persian decimal separator and thousands
// separators -> a JS number. type="number" inputs reject Persian digits in
// most browsers, which silently left fields empty for users on a Persian
// keyboard.
export function parseAmount(value) {
  if (value == null) return 0;
  const s = String(value)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[٬,\s]/g, '')
    .replace(/[٫/]/g, '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function monthlyInstallment(principal, annualRate, years) {
  if (!principal) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

// Months until `available` cash (growing by `savings`/month) covers the cash
// a purchase needs, when the house price itself grows `annualGrowth` per year
// (0 = static price). null = not reachable within `maxMonths`.
export function monthsToAfford({ targetPrice, ceiling, available, savings, annualGrowth = 0, maxMonths = 360 }) {
  const monthlyGrowth = Math.pow(1 + annualGrowth, 1 / 12) - 1;
  let price = targetPrice;
  let cash = available;
  for (let m = 0; m <= maxMonths; m++) {
    const loan = Math.min(ceiling, price);
    const needed = price - loan + loan * BOND_COST_RATIO;
    if (cash >= needed) return m;
    cash += savings;
    price *= 1 + monthlyGrowth;
  }
  return null;
}

export function computeSummary(form) {
  const m = (k) => parseAmount(form[k]) * MILLION;
  const couple = form.maritalStatus !== 'single';

  const totalMonthlyIncome = m('incomeSelf') + (couple ? m('incomeSpouse') : 0) + m('incomeOther');
  const liquidAssetsRaw = m('cash') + m('goldSilverValue');
  const netWorth = liquidAssetsRaw + m('otherProperty') + m('car') + m('otherInvestments');
  const weddingCost = form.maritalStatus === 'about_to_marry' ? m('weddingCost') : 0;
  // Cash actually available for housing once a planned wedding is paid for.
  const liquidAssets = Math.max(0, liquidAssetsRaw - weddingCost);

  const existingDebtPayments = m('existingDebtPayments');
  const monthlyExpenses = m('monthlyExpenses');
  const currentRent = form.isRentingNow ? m('currentRent') : 0;
  const monthlySavingsCapacity = totalMonthlyIncome - monthlyExpenses - existingDebtPayments - currentRent;

  const maxHousingPayment = totalMonthlyIncome * 0.28;
  const maxTotalDebt = totalMonthlyIncome * 0.36;
  const maxRent = totalMonthlyIncome * 0.3;

  const timelineMonths = Math.max(0, Math.round(parseAmount(form.timelineYears) * 12));
  const annualGrowth = parseAmount(form.priceGrowth) / 100;

  // --- buy ---
  const ceiling = TSE_CEILING[form.city][couple ? 'couple' : 'single'];
  const targetPrice = m('targetPrice');
  const loanAmount = Math.min(ceiling, targetPrice);
  const bondCost = loanAmount * BOND_COST_RATIO;
  const downPayment = Math.max(0, targetPrice - loanAmount);
  const cashNeeded = downPayment + bondCost;
  const installment = monthlyInstallment(loanAmount, TSE_RATE, TSE_YEARS);
  const months =
    targetPrice > 0
      ? monthsToAfford({
          targetPrice,
          ceiling,
          available: liquidAssets,
          savings: Math.max(0, monthlySavingsCapacity),
          annualGrowth,
        })
      : null;
  const buy = {
    ceiling,
    loanAmount,
    bondCost,
    downPayment,
    cashNeeded,
    installment,
    installmentShare: totalMonthlyIncome > 0 ? installment / totalMonthlyIncome : null,
    fitsHousingRule: installment <= maxHousingPayment,
    fitsTotalDebtRule: installment + existingDebtPayments <= maxTotalDebt,
    // Monthly room left after buying (the installment replaces current rent).
    monthlyLeftAfterBuying: totalMonthlyIncome - monthlyExpenses - existingDebtPayments - installment,
    monthsToAfford: months, // null = not within 30 years at current savings
    alreadyAffordable: months === 0,
    withinTimeline: months != null && months <= timelineMonths,
    annualGrowth,
  };

  // --- rent: deposit (رهن) + monthly rent, on the site's 3% convention ---
  const rent = {
    maxRent,
    maxDeposit: liquidAssets,
    // A listing's "rent equivalent" is rent + deposit × 3%; this is the
    // largest one affordable with all available cash as deposit.
    maxRentEquivalent: maxRent + liquidAssets * RAHN_RATE,
    fullDepositOnly: liquidAssets, // رهن کامل: no monthly rent
  };

  return {
    totalMonthlyIncome,
    netWorth,
    liquidAssets,
    liquidAssetsRaw,
    weddingCost,
    existingDebtPayments,
    monthlyExpenses,
    currentRent,
    monthlySavingsCapacity,
    dti: { maxRecommendedHousingPayment: maxHousingPayment, maxRecommendedTotalDebt: maxTotalDebt },
    rentAffordability: { recommendedMaxRent: maxRent },
    goalType: form.goalType,
    targetPrice,
    timelineMonths,
    buy,
    rent,
  };
}
