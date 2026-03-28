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
  if (!checkAdmin(user)) return fail('관리자만 접근 가능해요', null, 403)

  const sb = adminClient()
  const { status } = event.queryStringParameters || {}

  let query = sb
    .from('consultation_rooms')
    .select(`
      id, status, created_at, updated_at, estimate_snapshot,
      user:user_id ( id, email, raw_user_meta_data ),
      consultation_messages ( id, sender, content, created_at )
    `)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data: rooms, error } = await query
  if (error) return fail('목록 조회 실패', error.message, 500)

  // 각 방의 마지막 메시지만 포함
  const result = (rooms || []).map(r => {
    const msgs = r.consultation_messages || []
    const lastMsg = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
    return { ...r, consultation_messages: undefined, last_message: lastMsg, message_count: msgs.length }
  })

  return ok({ rooms: result })
}
