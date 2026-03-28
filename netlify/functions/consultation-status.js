import { adminClient } from '../../shared/db.js'
import { env } from '../../shared/env.js'
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js'

async function getAuthUser(event) {
  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await adminClient().auth.getUser(token)
  return user || null
}

function checkAdmin(user) {
  const adminEmails = (env('ADMIN_EMAILS') || '').split(',').map(e => e.trim()).filter(Boolean)
  return adminEmails.includes(user.email)
}

const VALID_STATUSES = ['waiting', 'active', 'closed']

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt
  if (event.httpMethod !== 'POST') return fail('POST만 허용', null, 405)

  const user = await getAuthUser(event)
  if (!user) return fail('로그인이 필요해요', null, 401)
  if (!checkAdmin(user)) return fail('관리자만 접근 가능해요', null, 403)

  const { room_id, status } = parseBody(event)
  if (!room_id || !status) return fail('room_id, status 필수', null, 400)
  if (!VALID_STATUSES.includes(status)) return fail('유효하지 않은 상태값이에요', null, 400)

  const { data: room, error } = await adminClient()
    .from('consultation_rooms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', room_id)
    .select('id, status')
    .single()

  if (error) return fail('상태 변경 실패', error.message, 500)
  return ok({ room })
}
