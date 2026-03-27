import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { adminClient } from '../../shared/db.js'
import { sendSms } from '../../shared/sms.js'
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

  const { phone, name } = body
  if (!phone || !name) return fail('이름과 전화번호를 입력해주세요.')

  const cleanPhone = phone.replace(/[^0-9]/g, '')
  if (!/^01[0-9]{8,9}$/.test(cleanPhone)) return fail('올바른 휴대폰 번호를 입력해주세요.')
  if (!name.trim()) return fail('이름을 입력해주세요.')

  // 60초 재전송 제한
  const meta = user.user_metadata || {}
  if (meta.otp_sent_at && Date.now() - new Date(meta.otp_sent_at).getTime() < 60000) {
    return fail('잠시 후 다시 시도해주세요. (60초)')
  }

  const otp = String(parseInt(crypto.randomBytes(3).toString('hex'), 16) % 900000 + 100000)
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const supabase = adminClient()
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      otp_code: otp,
      otp_expires_at: expiresAt,
      otp_sent_at: now,
      otp_phone: cleanPhone,
      pending_name: name.trim(),
    },
  })
  if (error) return fail('인증번호 생성에 실패했습니다.', error.message, 500)

  const smsResult = await sendSms(cleanPhone, `[당고] 인증번호: ${otp} (5분 내 입력)`)
  if (!smsResult.sent && !smsResult.mocked) {
    return fail('SMS 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
  }

  return ok({ sent: true })
}
