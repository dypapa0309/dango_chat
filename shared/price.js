export function calculatePrice(input = {}) {
  const pricingMultiplier = Math.max(0, Number(input.pricingMultiplier || 1));
  const distanceKm = Math.max(0, Number(input.distanceKm || 0));
  const floor = Math.max(0, Number(input.floor || 0));
  const weightKg = Math.max(0, Number(input.weightKg || 0));
  const options = input.options || {};
  const hasVia = Boolean(input.hasVia);
  const hasElevator = Boolean(input.hasElevator);

  const base = 30000;
  const distanceFee = Math.round(distanceKm) * 1500;
  // 엘리베이터 없는 경우에만 층수 요금 적용
  const floorFee = hasElevator ? 0 : floor * 5000;
  const weightFee = Math.floor(weightKg / 20) * 3000;
  const viaFee = hasVia ? 15000 : 0;
  const helperFee = options.helper ? 20000 : 0;
  const packingFee = options.packing ? 30000 : 0;
  const cleaningFee = options.cleaning ? 50000 : 0;

  const subtotal = base + distanceFee + floorFee + weightFee + viaFee + helperFee + packingFee + cleaningFee;
  const total = Math.round(subtotal * pricingMultiplier);
  const deposit = Math.round(total * 0.2);
  const balance = total - deposit;
  const driverAmount = Math.round(total * 0.8);
  const companyAmount = total - driverAmount;

  return {
    version: 'v1',
    pricingMultiplier,
    base,
    distanceFee,
    floorFee,
    weightFee,
    viaFee,
    helperFee,
    packingFee,
    cleaningFee,
    subtotal,
    total,
    deposit,
    balance,
    driverAmount,
    companyAmount
  };
}
