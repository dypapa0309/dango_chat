function pad(value) {
  return String(value).padStart(2, '0');
}

function toKstShiftedDate(input) {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}

export function getBiweeklyPeriod(input) {
  const shifted = toKstShiftedDate(input);
  if (!shifted) return null;

  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const firstHalf = day <= 14;
  const startDay = firstHalf ? 1 : 15;
  const endDay = firstHalf ? 14 : lastDay;
  const half = firstHalf ? 'A' : 'B';

  return {
    key: `${year}-${pad(month)}-${half}`,
    startDate: `${year}-${pad(month)}-${pad(startDay)}`,
    endDate: `${year}-${pad(month)}-${pad(endDay)}`,
    label: `${year}.${pad(month)} ${startDay}일~${endDay}일`
  };
}

export function buildApprovedSettlementFields(input, overrides = {}) {
  const period = getBiweeklyPeriod(input || new Date());
  return {
    status: 'approved',
    approved_at: new Date().toISOString(),
    payout_period_key: period?.key || null,
    payout_period_start: period?.startDate || null,
    payout_period_end: period?.endDate || null,
    ...overrides
  };
}

export function calculateFreelancerWithholding(grossAmount, rate = 0.033) {
  const gross = Math.max(0, Number(grossAmount || 0));
  const normalizedRate = Number(rate || 0.033);
  const withholdingAmount = Math.round(gross * normalizedRate);
  const netAmount = Math.max(0, gross - withholdingAmount);

  return {
    grossAmount: gross,
    withholdingRate: normalizedRate,
    withholdingAmount,
    netAmount
  };
}

export function getSettlementPeriod(row) {
  if (row?.payout_period_key && row?.payout_period_start && row?.payout_period_end) {
    return {
      key: row.payout_period_key,
      startDate: row.payout_period_start,
      endDate: row.payout_period_end,
      label: `${row.payout_period_start} ~ ${row.payout_period_end}`
    };
  }

  return getBiweeklyPeriod(row?.approved_at || row?.created_at || new Date());
}
