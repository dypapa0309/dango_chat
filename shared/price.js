export function calculatePrice(input = {}) {
  const distanceKm = Number(input.distanceKm || 0);
  const floor = Number(input.floor || 0);
  const weightKg = Number(input.weightKg || 0);
  const options = input.options || {};
  const hasVia = Boolean(input.hasVia);

  const base = 30000;
  const distanceFee = Math.round(distanceKm) * 1500;
  const floorFee = floor * 5000;
  const weightFee = Math.floor(weightKg / 20) * 3000;
  const viaFee = hasVia ? 15000 : 0;
  const helperFee = options.helper ? 20000 : 0;
  const packingFee = options.packing ? 30000 : 0;
  const cleaningFee = options.cleaning ? 50000 : 0;

  const total = base + distanceFee + floorFee + weightFee + viaFee + helperFee + packingFee + cleaningFee;
  const deposit = Math.round(total * 0.2);
  const balance = total - deposit;
  const driverAmount = Math.round(total * 0.8);
  const companyAmount = total - driverAmount;

  return {
    version: 'v1',
    base,
    distanceFee,
    floorFee,
    weightFee,
    viaFee,
    helperFee,
    packingFee,
    cleaningFee,
    total,
    deposit,
    balance,
    driverAmount,
    companyAmount
  };
}
