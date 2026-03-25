/**
 * 전화번호로 기존 기사 레코드에 user_id 연결
 */
import { createClient } from '@supabase/supabase-js';
import { adminClient, publicConfig } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!bearerToken) return fail('로그인이 필요합니다.', null, 401);

  try {
    const { supabaseUrl, supabaseAnonKey } = publicConfig();
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser(bearerToken);
    if (authErr || !user) return fail('유효하지 않은 세션입니다.', null, 401);

    const { phone } = parseBody(event);
    const normalizedPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (!normalizedPhone || normalizedPhone.length < 10) return fail('올바른 전화번호를 입력해주세요.');

    const supabase = adminClient();

    // 이미 user_id 연결된 기사가 있는지 확인
    const { data: existing } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) return ok({ driver: existing, message: '이미 연결된 계정이 있어요.' });

    // 전화번호로 기사 조회
    const { data: driver, error: findErr } = await supabase
      .from('drivers')
      .select('id, name, status, user_id')
      .eq('phone', normalizedPhone)
      .eq('status', 'active')
      .maybeSingle();

    if (findErr) throw findErr;
    if (!driver) return fail('해당 전화번호로 등록된 전문가 계정을 찾을 수 없어요.');
    if (driver.user_id) return fail('이미 다른 계정에 연결된 전화번호예요.');

    // user_id 연결
    const { error: updateErr } = await supabase
      .from('drivers')
      .update({ user_id: user.id })
      .eq('id', driver.id);
    if (updateErr) throw updateErr;

    return ok({ driver: { id: driver.id, name: driver.name }, message: '계정이 연결됐어요.' });
  } catch (err) {
    return fail('계정 연결 실패', err.message, 500);
  }
}
