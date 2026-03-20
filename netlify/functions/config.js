import { publicConfig } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  try {
    return ok({
      ...publicConfig(),
      tossClientKey: env('TOSS_CLIENT_KEY', 'TOSS_WIDGET_CLIENT_KEY')
    });
  } catch (error) {
    return fail('config 로드 실패', error.message, 500);
  }
}
