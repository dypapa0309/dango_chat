export function resolveRevenueSplit(totalPrice, companyAmount, driverAmount) {
  const total = Math.max(0, Math.round(Number(totalPrice || 0)));
  const company = Math.max(0, Math.round(Number(companyAmount || 0)));
  const driver = Math.max(0, Math.round(Number(driverAmount || 0)));

  if (total > 0 && company + driver === total) {
    return {
      total,
      companyAmount: company,
      driverAmount: driver
    };
  }

  const normalizedCompany = Math.round(total * 0.2);
  return {
    total,
    companyAmount: normalizedCompany,
    driverAmount: Math.max(0, total - normalizedCompany)
  };
}
