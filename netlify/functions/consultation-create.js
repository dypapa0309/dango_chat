import { adminClient } from '../../shared/db.js'
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js'

async function getAuthUser(event) {
  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await adminClient().auth.getUser(token)
  return user || null
}

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt
  if (event.httpMethod !== 'POST') return fail('POST만 허용', null, 405)

  const user = await getAuthUser(event)
  if (!user) return fail('로그인이 필요해요', null, 401)

  const { estimate_snapshot } = parseBody(event)

  const { data: room, error } = await adminClient()
    .from('consultation_rooms')
    .insert({ user_id: user.id, estimate_snapshot: estimate_snapshot || null, status: 'waiting' })
    .select('id, status, created_at')
    .single()

  if (error) return fail('상담방 생성 실패', error.message, 500)
  return ok({ room })
}
