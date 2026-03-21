import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

function normalizeAccountNumber(value) {
  return String(value || '').replace(/[^0-9-]/g, '');
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { driverId, bankName, accountNumber, accountHolder, payoutEnabled, payoutNote } = parseBody(event);
    if (!driverId) return fail('driverId가 필요합니다.');

    const supabase = adminClient();
    const payload = {
      bank_name: (bankName || '').trim() || null,
      account_number: normalizeAccountNumber(accountNumber) || null,
      account_holder: (accountHolder || '').trim() || null,
      payout_enabled: Boolean(payoutEnabled),
      payout_note: (payoutNote || '').trim() || null
    };

    const { data, error } = await supabase
      .from('drivers')
      .update(payload)
      .eq('id', driverId)
      .select('id, name, phone, bank_name, account_number, account_holder, payout_enabled, payout_note')
      .single();

    if (error) throw error;
    return ok({ driver: data });
  } catch (error) {
    return fail('기사 정산 정보 저장 실패', error.message, 500);
  }
}
