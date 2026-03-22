import crypto from 'crypto';
import { adminClient } from '../../shared/db.js';
import { calculatePrice } from '../../shared/price.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { ensurePricingStateRow } from '../../shared/pricing-state.js';
import { resolveRevenueSplit } from '../../shared/revenue.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const body = parseBody(event);
    const override = body.price_override || null;
    const supabase = adminClient();
    const pricingState = await ensurePricingStateRow(supabase);
    const calculated = calculatePrice({
      distanceKm: body.distance_km,
      floor: body.floor,
      weightKg: body.weight_kg,
      pricingMultiplier: Number(pricingState.current_multiplier || 1),
      options: body.option_summary || {},
      hasVia: Boolean(body.via_address)
    });

    const resolvedSplit = resolveRevenueSplit(
      override?.total || calculated.total,
      override?.companyAmount,
      override?.driverAmount
    );

    const price = override
      ? {
          ...calculated,
          ...override,
          total: Number(override.total || calculated.total || 0),
          deposit: Number(override.deposit || calculated.deposit || 0),
          balance: Number(override.balance || calculated.balance || 0),
          driverAmount: resolvedSplit.driverAmount,
          companyAmount: resolvedSplit.companyAmount,
          version: override.version || `${calculated.version}-override`
        }
      : calculated;

    const payload = {
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_note: body.customer_note || null,
      move_date: body.move_date,
      start_address: body.start_address,
      start_address_detail: body.start_address_detail || null,
      start_lat: body.start_lat || 0,
      start_lng: body.start_lng || 0,
      end_address: body.end_address,
      end_address_detail: body.end_address_detail || null,
      end_lat: body.end_lat || 0,
      end_lng: body.end_lng || 0,
      via_address: body.via_address || null,
      item_summary: body.item_summary || {},
      option_summary: body.option_summary || {},
      raw_text: body.raw_text || null,
      price_snapshot: price,
      price_version: price.version,
      total_price: price.total,
      deposit_amount: price.deposit,
      balance_amount: price.balance,
      driver_amount: price.driverAmount,
      company_amount: price.companyAmount,
      customer_complete_token: crypto.randomUUID(),
      customer_cancel_token: crypto.randomUUID(),
      acquisition_source: body.acquisition_source || 'direct',
      acquisition_medium: body.acquisition_medium || null,
      acquisition_campaign: body.acquisition_campaign || null,
      status: 'deposit_pending',
      dispatch_status: 'idle',
      created_by: body.created_by || 'customer-form',
      updated_by: body.updated_by || body.created_by || 'customer-form'
    };

    let insertPayload = payload;
    let { data, error } = await supabase.from('jobs').insert(insertPayload).select('*').single();

    if (error && /customer_(complete|cancel)_token/i.test(error.message || '')) {
      const {
        customer_complete_token,
        customer_cancel_token,
        customer_completed_at,
        customer_completion_note,
        customer_canceled_at,
        customer_cancel_note,
        ...fallbackPayload
      } = payload;
      insertPayload = fallbackPayload;
      ({ data, error } = await supabase.from('jobs').insert(insertPayload).select('*').single());
    }

    if (error) throw error;
    return ok({ job: data, price });
  } catch (error) {
    return fail('주문 생성 실패', error.message, 500);
  }
}
