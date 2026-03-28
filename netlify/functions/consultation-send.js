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

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt
  if (event.httpMethod !== 'POST') return fail('POST만 허용', null, 405)

  const user = await getAuthUser(event)
  if (!user) return fail('로그인이 필요해요', null, 401)

  const { room_id, content } = parseBody(event)
  if (!room_id || !content?.trim()) return fail('room_id, content 필수', null, 400)
  if (content.length > 2000) return fail('메시지는 2000자 이하로 입력해주세요', null, 400)

  const sb = adminClient()

  // 방 조회 + 권한 확인
  const { data: room } = await sb
    .from('consultation_rooms')
    .select('id, user_id, status')
    .eq('id', room_id)
    .single()

  if (!room) return fail('존재하지 않는 상담방이에요', null, 404)
  if (room.status === 'closed') return fail('종료된 상담이에요', null, 400)

  const isAdmin = checkAdmin(user)
  const isOwner = room.user_id === user.id

  if (!isAdmin && !isOwner) return fail('권한이 없어요', null, 403)

  const sender = isAdmin ? 'agent' : 'customer'

  // 에이전트가 첫 메시지 보내면 상태를 active로
  if (isAdmin && room.status === 'waiting') {
    await sb.from('consultation_rooms').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', room_id)
  }

  const { data: message, error } = await sb
    .from('consultation_messages')
    .insert({ room_id, sender, content: content.trim() })
    .select('id, sender, content, created_at')
    .single()

  if (error) return fail('메시지 전송 실패', error.message, 500)
  return ok({ message })
}
