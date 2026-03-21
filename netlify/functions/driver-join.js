import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

const CONTRACT_VERSION = '2026-03-21-v1';

async function loadDriverByToken(supabase, token) {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, name, phone, vehicle_type, vehicle_note, vehicle_number, bank_name, account_number, account_holder, payout_enabled, payout_note, dispatch_enabled, status, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, join_token')
    .eq('join_token', token)
    .single();
  if (error) throw error;
  return data;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  try {
    const supabase = adminClient();

    if (event.httpMethod === 'GET') {
      const token = event?.queryStringParameters?.token;
      if (!token) return fail('token이 필요합니다.');
      const driver = await loadDriverByToken(supabase, token);
      return ok({ driver, contractVersion: CONTRACT_VERSION });
    }

    if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

    const {
      token,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      bankName,
      accountNumber,
      accountHolder,
      payoutNote,
      commercialPlateConfirmed,
      contractAgreed
    } = parseBody(event);

    if (!token) return fail('token이 필요합니다.');
    if (!contractAgreed) return fail('위탁운송 계약 동의가 필요합니다.');
    if (!commercialPlateConfirmed) return fail('영업용 차량 확인이 필요합니다.');

    const driver = await loadDriverByToken(supabase, token);

    const { data, error } = await supabase
      .from('drivers')
      .update({
        name: (name || driver.name || '').trim(),
        phone: (phone || driver.phone || '').trim(),
        vehicle_type: (vehicleType || driver.vehicle_type || '').trim() || null,
        vehicle_number: (vehicleNumber || '').trim() || null,
        bank_name: (bankName || '').trim() || null,
        account_number: (accountNumber || '').trim() || null,
        account_holder: (accountHolder || '').trim() || null,
        payout_note: (payoutNote || '').trim() || null,
        commercial_plate_confirmed: true,
        consign_contract_agreed: true,
        consign_contract_version: CONTRACT_VERSION,
        consign_contract_accepted_at: new Date().toISOString(),
        dispatch_enabled: true,
        updated_by: 'driver-join'
      })
      .eq('id', driver.id)
      .select('id, name, phone, vehicle_type, vehicle_number, bank_name, account_number, account_holder, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, join_token')
      .single();

    if (error) throw error;
    return ok({ driver: data, contractVersion: CONTRACT_VERSION });
  } catch (error) {
    return fail('기사 가입 처리 실패', error.message, 500);
  }
}
