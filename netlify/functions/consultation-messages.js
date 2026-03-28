import { adminClient } from '../../shared/db.js'
import { env } from '../../shared/env.js'
import { ok, fail, handleOptions } from '../../shared/http.js'

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

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt
  if (event.httpMethod !== 'GET') return fail('GET만 허용', null, 405)

  const user = await getAuthUser(event)
  if (!user) return fail('로그인이 필요해요', null, 401)

  const { room_id } = event.queryStringParameters || {}
  if (!room_id) return fail('room_id 필수', null, 400)

  const sb = adminClient()

  const { data: room } = await sb
    .from('consultation_rooms')
    .select('id, user_id, status, estimate_snapshot, created_at, user:user_id ( id, email, raw_user_meta_data )')
    .eq('id', room_id)
    .single()

  if (!room) return fail('존재하지 않는 상담방이에요', null, 404)
  if (!checkAdmin(user) && room.user_id !== user.id) return fail('권한이 없어요', null, 403)

  const { data: messages, error } = await sb
    .from('consultation_messages')
    .select('id, sender, content, created_at')
    .eq('room_id', room_id)
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) return fail('메시지 조회 실패', error.message, 500)
  return ok({ room, messages: messages || [] })
}
