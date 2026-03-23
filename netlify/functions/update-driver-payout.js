import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

function normalizeAccountNumber(value) {
  return String(value || '').replace(/[^0-9-]/g, '');
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const { driverId, status, dispatchEnabled, bankName, accountNumber, accountHolder, payoutEnabled, payoutNote, internalMemo, taxName, taxBirthDate, taxIdNumber, taxEmail, taxAddress, taxWithholdingAgreed, supportsMove, supportsClean, supportsYd } = parseBody(event);
    if (!driverId) return fail('driverId가 필요합니다.');

    const supabase = adminClient();
    const payload = {
      status: (status || '').trim() || 'pending_review',
      dispatch_enabled: Boolean(dispatchEnabled),
      bank_name: (bankName || '').trim() || null,
      account_number: normalizeAccountNumber(accountNumber) || null,
      account_holder: (accountHolder || '').trim() || null,
      payout_enabled: Boolean(payoutEnabled),
      payout_note: (payoutNote || '').trim() || null,
      internal_memo: (internalMemo || '').trim() || null,
      tax_name: (taxName || '').trim() || null,
      tax_birth_date: (taxBirthDate || '').trim() || null,
      tax_id_number: (taxIdNumber || '').trim() || null,
      tax_email: (taxEmail || '').trim() || null,
      tax_address: (taxAddress || '').trim() || null,
      tax_withholding_type: 'freelancer_3_3',
      tax_withholding_agreed: Boolean(taxWithholdingAgreed),
      supports_move: Boolean(supportsMove),
      supports_clean: Boolean(supportsClean),
      supports_yd: Boolean(supportsYd)
    };

    const { data, error } = await supabase
      .from('drivers')
      .update(payload)
      .eq('id', driverId)
      .select('id, name, phone, status, dispatch_enabled, bank_name, account_number, account_holder, payout_enabled, payout_note, internal_memo, tax_name, tax_birth_date, tax_id_number, tax_email, tax_address, tax_withholding_type, tax_withholding_agreed, supports_move, supports_clean, supports_yd')
      .single();

    if (error) throw error;
    return ok({ driver: data });
  } catch (error) {
    return fail('기사 정산 정보 저장 실패', error.message, 500);
  }
}
