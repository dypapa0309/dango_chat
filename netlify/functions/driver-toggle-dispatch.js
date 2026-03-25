import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { resolveDriver } from '../../shared/driver-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { token, enabled } = parseBody(event);

    if (typeof enabled !== 'boolean') return fail('enabled는 true 또는 false여야 합니다.');

    const resolved = await resolveDriver(event, token || null);
    if (!resolved) return fail('로그인이 필요하거나 유효하지 않은 토큰이에요.', null, 401);
    const { driver, supabase } = resolved;

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
