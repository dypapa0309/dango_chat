import { createClient } from '@supabase/supabase-js';
import { adminClient, publicConfig } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

const DRIVER_FIELDS = 'id, name, phone, vehicle_type, vehicle_note, vehicle_number, bank_name, account_number, account_holder, payout_enabled, payout_note, dispatch_enabled, status, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, join_token, tax_name, tax_birth_date, tax_id_number, tax_email, tax_address, tax_withholding_type, tax_withholding_agreed, supports_move, supports_clean, supports_yd, supported_services, user_id';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return fail('로그인이 필요합니다.', null, 401);

  try {
    const { supabaseUrl, supabaseAnonKey } = publicConfig();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !user) return fail('유효하지 않은 세션입니다.', null, 401);

    const supabase = adminClient();

    // user_id로 기사 조회
    const { data: driver, error } = await supabase
      .from('drivers')
      .select(DRIVER_FIELDS)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (driver) {
      return ok({ driver, linked: true });
    }

    // user_id 매칭 안 됨 — 전화번호로 연결 필요
    return ok({ driver: null, linked: false, email: user.email });
  } catch (err) {
    return fail('기사 정보 조회 실패', err.message, 500);
  }
}
