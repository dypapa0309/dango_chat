import { adminClient } from '../../shared/db.js';
import { calculatePrice } from '../../shared/price.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const body = parseBody(event);
    const price = calculatePrice({
      distanceKm: body.distance_km,
      floor: body.floor,
      weightKg: body.weight_kg,
      options: body.option_summary || {},
      hasVia: Boolean(body.via_address)
    });

    const supabase = adminClient();
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
      status: 'deposit_pending',
      dispatch_status: 'idle',
      created_by: 'customer-form',
      updated_by: 'customer-form'
    };

    const { data, error } = await supabase.from('jobs').insert(payload).select('*').single();
    if (error) throw error;
    return ok({ job: data, price });
  } catch (error) {
    return fail('주문 생성 실패', error.message, 500);
  }
}
