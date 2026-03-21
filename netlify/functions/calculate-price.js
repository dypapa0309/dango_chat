import { calculatePrice } from '../../shared/price.js';
import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { ensurePricingStateRow } from '../../shared/pricing-state.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const body = parseBody(event);
    const state = await ensurePricingStateRow(adminClient());
    const options = body.options || {};
    const items = body.items || {};
    const price = calculatePrice({
      distanceKm: body.distance ?? body.distance_km ?? 0,
      floor: body.floor ?? 0,
      weightKg: items.weight_kg ?? body.weight_kg ?? 0,
      pricingMultiplier: Number(state.current_multiplier || 1),
      options,
      hasVia: Boolean(options.via_stop || body.via_address)
    });

    return ok({
      total_price: price.total,
      deposit: price.deposit,
      balance: price.balance,
      breakdown: {
        base: price.base,
        distanceFee: price.distanceFee,
        floorFee: price.floorFee,
        weightFee: price.weightFee,
        helperFee: price.helperFee,
        packingFee: price.packingFee,
        cleaningFee: price.cleaningFee,
        viaFee: price.viaFee
      },
      price
    });
  } catch (error) {
    return fail('가격 계산 실패', error.message, 500);
  }
}
