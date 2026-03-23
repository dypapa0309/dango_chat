export const HELPER_CUSTOMER_FEE = 60000;
export const HELPER_DRIVER_FEE = 40000;
export const LADDER_CUSTOMER_FEE = 120000;
export const LADDER_DRIVER_FEE = 100000;

function countTruthy(...values) {
  return values.filter(Boolean).length;
}

export function resolveRevenueSplit(totalPrice, companyAmount, driverAmount, optionSummary = {}) {
  const total = Math.max(0, Math.round(Number(totalPrice || 0)));
  const company = Math.max(0, Math.round(Number(companyAmount || 0)));
  const driver = Math.max(0, Math.round(Number(driverAmount || 0)));

  const helperCount = countTruthy(optionSummary.helperFrom, optionSummary.helperTo);
  const ladderCount = countTruthy(optionSummary.ladderFrom, optionSummary.ladderTo, optionSummary.waypointLadder);

  const helperCustomerAmount = helperCount * HELPER_CUSTOMER_FEE;
  const helperDriverAmount = helperCount * HELPER_DRIVER_FEE;
  const ladderCustomerAmount = ladderCount * LADDER_CUSTOMER_FEE;
  const ladderDriverAmount = ladderCount * LADDER_DRIVER_FEE;

  const specialCustomerAmount = helperCustomerAmount + ladderCustomerAmount;
  const specialDriverAmount = helperDriverAmount + ladderDriverAmount;
  const specialCompanyAmount = Math.max(0, specialCustomerAmount - specialDriverAmount);

  if (total > 0 && (helperCount > 0 || ladderCount > 0)) {
    const coreTotal = Math.max(0, total - specialCustomerAmount);
    const coreCompanyAmount = Math.round(coreTotal * 0.2);
    const coreDriverAmount = Math.max(0, coreTotal - coreCompanyAmount);
    return {
      total,
      companyAmount: coreCompanyAmount + specialCompanyAmount,
      driverAmount: coreDriverAmount + specialDriverAmount,
      helperCount,
      ladderCount,
      helperCustomerAmount,
      helperDriverAmount,
      ladderCustomerAmount,
      ladderDriverAmount,
      specialCompanyAmount
    };
  }

  if (total > 0 && company + driver === total) {
    return {
      total,
      companyAmount: company,
      driverAmount: driver,
      helperCount,
      ladderCount,
      helperCustomerAmount,
      helperDriverAmount,
      ladderCustomerAmount,
      ladderDriverAmount,
      specialCompanyAmount
    };
  }

  const normalizedCompany = Math.round(total * 0.2);
  return {
    total,
    companyAmount: normalizedCompany,
    driverAmount: Math.max(0, total - normalizedCompany),
    helperCount,
    ladderCount,
    helperCustomerAmount,
    helperDriverAmount,
    ladderCustomerAmount,
    ladderDriverAmount,
    specialCompanyAmount
  };
}
