import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { token, enabled } = parseBody(event);

    if (!token) return fail('token이 필요합니다.');
    if (typeof enabled !== 'boolean') return fail('enabled는 true 또는 false여야 합니다.');

    const supabase = adminClient();

    // Look up driver by join_token
    const { data: driver, error: lookupError } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('join_token', token)
      .single();

    if (lookupError || !driver) return fail('유효하지 않은 토큰이에요.');

    // Update dispatch_enabled
    const { error: updateError } = await supabase
      .from('drivers')
      .update({ dispatch_enabled: enabled })
      .eq('id', driver.id);

    if (updateError) throw updateError;

    return ok({ dispatch_enabled: enabled });
  } catch (error) {
    return fail('배차 설정 변경에 실패했어요.', error.message, 500);
  }
}
