/**
 * 전문가 인증 헬퍼
 * Bearer 세션 토큰 또는 레거시 join_token 양쪽 모두 지원
 */
import { createClient } from '@supabase/supabase-js';
import { adminClient, publicConfig } from './db.js';

const DRIVER_FIELDS = 'id, name, phone, vehicle_type, vehicle_note, vehicle_number, bank_name, account_number, account_holder, payout_enabled, payout_note, dispatch_enabled, status, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, join_token, tax_name, tax_birth_date, tax_id_number, tax_email, tax_address, tax_withholding_type, tax_withholding_agreed, supports_move, supports_clean, supports_yd, supported_services, user_id';

/**
 * 요청에서 전문가 레코드를 해석
 * @param {object} event - Netlify event 객체
 * @param {string} [legacyToken] - join_token (body 또는 querystring에서 추출한 값)
 * @returns {{ driver, supabase } | null}
 */
export async function resolveDriver(event, legacyToken = null) {
  const supabase = adminClient();
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  // 1. Bearer 세션 우선
  if (bearerToken) {
    const { supabaseUrl, supabaseAnonKey } = publicConfig();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser(bearerToken);
    if (!authErr && user) {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select(DRIVER_FIELDS)
        .eq('user_id', user.id)
        .single();
      if (!error && driver) return { driver, supabase };
    }
  }

  // 2. 레거시 join_token 폴백
  if (legacyToken) {
    const { data: driver, error } = await supabase
      .from('drivers')
      .select(DRIVER_FIELDS)
      .eq('join_token', legacyToken)
      .single();
    if (!error && driver) return { driver, supabase };
  }

  return null;
}
