/**
 * API helpers — all calls go through Netlify functions
 */
import { getSupabase } from './supabase.js'

async function getAccessToken() {
  try {
    const { data } = await getSupabase().auth.getSession()
    return data.session?.access_token || null
  } catch {
    return null
  }
}

export async function sendChatMessage({ messages, state, conversationId }) {
  const res = await fetch('/.netlify/functions/chat-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, state, conversationId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'AI 응답 실패')
  }
  return res.json()
}

export async function calculatePrice(params) {
  const res = await fetch('/.netlify/functions/calculate-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('가격 계산 실패')
  return res.json()
}

export async function createJob(payload) {
  const token = await getAccessToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/.netlify/functions/create-job', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '접수 실패')
  }
  return res.json()
}

export async function getRoutePrice({ start, end, floor = 0, helper = false }) {
  const params = new URLSearchParams({
    start,
    end,
    floor: String(floor || 0),
    helper: helper ? '1' : '0',
  })
  const res = await fetch(`/.netlify/functions/get-route-price?${params}`)
  if (!res.ok) throw new Error('거리 계산 실패')
  return res.json()
}

export async function fetchConfig() {
  const res = await fetch('/.netlify/functions/config')
  if (!res.ok) throw new Error('config 로드 실패')
  return res.json()
}

async function authPost(path, body) {
  const token = await getAccessToken()
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || '요청 실패')
  return json
}

export async function sendPhoneOtp({ name, phone }) {
  return authPost('/.netlify/functions/send-phone-otp', { name, phone })
}

export async function verifyPhoneOtp({ otp }) {
  return authPost('/.netlify/functions/verify-phone-otp', { otp })
}
