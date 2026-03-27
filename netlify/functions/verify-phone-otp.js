import { createClient } from '@supabase/supabase-js'
import { adminClient } from '../../shared/db.js'
import { ok, fail, handleOptions } from '../../shared/http.js'
import { mustEnv } from '../../shared/env.js'

async function getAuthUser(event) {
  try {
    const token = (event.headers?.authorization || event.headers?.Authorization || '')
      .replace(/^Bearer\s+/i, '').trim()
    if (!token) return null
    const client = createClient(mustEnv('SUPABASE_URL'), mustEnv('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'))
    const { data: { user } } = await client.auth.getUser(token)
    return user || null
  } catch {
    return null
  }
}

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.')

  const user = await getAuthUser(event)
  if (!user) return fail('로그인이 필요합니다.', null, 401)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return fail('잘못된 요청입니다.') }

  const { otp } = body
  if (!otp) return fail('인증번호를 입력해주세요.')

  const meta = user.user_metadata || {}
  if (!meta.otp_code) return fail('인증번호를 먼저 발송해주세요.')
  if (new Date(meta.otp_expires_at) < new Date()) return fail('인증번호가 만료됐어요. 다시 발송해주세요.')
  if (meta.otp_code !== String(otp).trim()) return fail('인증번호가 올바르지 않아요.')

  const supabase = adminClient()
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      phone: meta.otp_phone,
      full_name: meta.pending_name || meta.full_name,
      phone_verified: true,
      otp_code: null,
      otp_expires_at: null,
      otp_sent_at: null,
      otp_phone: null,
      pending_name: null,
    },
  })
  if (error) return fail('인증 완료 처리 중 오류가 발생했습니다.', error.message, 500)

  return ok({ verified: true, name: meta.pending_name || meta.full_name, phone: meta.otp_phone })
}
