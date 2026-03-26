/**
 * API helpers — all calls go through Netlify functions
 */

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
  const res = await fetch('/.netlify/functions/create-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '접수 실패')
  }
  return res.json()
}

export async function fetchConfig() {
  const res = await fetch('/.netlify/functions/config')
  if (!res.ok) throw new Error('config 로드 실패')
  return res.json()
}
