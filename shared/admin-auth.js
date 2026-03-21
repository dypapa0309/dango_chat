import { env } from './env.js';
import { json } from './http.js';

function readAdminToken(event) {
  const headers = event?.headers || {};
  const authHeader = headers.authorization || headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return headers['x-admin-token'] || headers['X-Admin-Token'] || '';
}

export function requireAdmin(event) {
  const expected = String(env('ADMIN_TOKEN', '') || '').trim();
  if (!expected) {
    return json({ success: false, error: 'ADMIN_TOKEN이 설정되지 않았어요.' }, 503);
  }

  const provided = readAdminToken(event);
  if (!provided || provided !== expected) {
    return json({ success: false, error: '관리자 인증이 필요해요.' }, 401);
  }

  return null;
}
