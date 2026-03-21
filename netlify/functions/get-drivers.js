import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('drivers')
      .select('id, name, phone, status, dispatch_enabled, completed_jobs, rating, acceptance_rate, response_score, bank_name, account_number, account_holder, payout_enabled, payout_note, join_token, vehicle_type, vehicle_number, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ok({ drivers: data || [] });
  } catch (error) {
    return fail('기사 목록 조회 실패', error.message, 500);
  }
}
