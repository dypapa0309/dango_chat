import OpenAI from 'openai'
import { handleOptions, ok, fail } from '../../shared/http.js'
import { env } from '../../shared/env.js'
import { adminClient } from '../../shared/db.js'
import { SERVICES, SERVICE_SUMMARY } from './_data/services/index.js'

const BASE_PROMPT = `당신은 당고(DANG-O) AI 상담사입니다.

## 핵심 규칙
1. 친근하고 간결하게 한국어로 응답
2. 한 번에 하나씩만 물어보기
3. state.collected에 이미 있는 정보는 절대 다시 묻지 않기
4. 선택지 → choices 카드 | 주소 → address_picker | 날짜 → date_picker
5. 수집 완료 신호가 오면 즉시 estimate 카드 제시

## 응답 형식 (항상 JSON)
{"message":"사용자에게 보낼 메시지","card":null,"state":{"service_type":null,"phase":"greeting","collected":{}}}`

const KNOWLEDGE_BASE = `
## 운영 정보
- 상담·예약: 24시간 AI 채팅
- 전문가 서비스 가능 시간: 오전 8시 ~ 오후 9시 (공휴일 포함)
- 고객센터: 010-4094-1666 / dangzang.gogo@gmail.com
- 서비스 지역: 수도권(서울·경기·인천) 중심, 지방 일부 가능 (문의)

## 결제
- 예약금(계약금): 전체 금액의 20% 선결제
- 잔금: 서비스 완료 후 80% 결제
- 결제 수단: 신용카드, 체크카드

## 환불 정책
- 서비스 24시간 전 취소: 전액 환불
- 서비스 24시간 이내 ~ 2시간 전: 50% 환불
- 서비스 2시간 이내 또는 당일 취소: 환불 불가
- 전문가 과실: 100% 환불 또는 재서비스

## 자주 묻는 질문
Q: 전문가는 언제 배정되나요?
A: 예약금 결제 완료 후 30분~2시간 내 인근 전문가가 배정됩니다.

Q: 전문가를 직접 선택할 수 있나요?
A: 현재는 시스템 자동 배정입니다. 특정 전문가 요청은 고객센터로 문의해주세요.

Q: 서비스 후 불만족 시 어떻게 하나요?
A: 완료 후 24시간 내 고객센터 연락 시 재서비스 또는 환불 처리해드립니다.
`
import { calculateServicePrice } from '../../shared/service-pricing.js'

// ── 유틸 ─────────────────────────────────────────────────────
function parseFloor(val) {
  if (!val) return 0
  const n = parseInt(String(val))
  return Number.isFinite(n) && n > 0 ? n : 0
}
function noElevator(val) { return String(val || '').includes('없음') }
function money(n) { return Math.round(n / 1000) * 1000 }

// ── 프롬프트 동적 생성 ────────────────────────────────────────
function buildSystemPrompt(state) {
  const { service_type, collected = {} } = state || {}
  if (!service_type || !SERVICES[service_type]) {
    return BASE_PROMPT + '\n\n' + SERVICE_SUMMARY + '\n\n' + KNOWLEDGE_BASE
  }
  const svc = SERVICES[service_type]
  const missing = svc.steps.filter(s => !collected[s.field]).map(s => s.field)
  const ctx = `## 현재 서비스: ${svc.name}
## 아직 수집 안 된 항목: ${missing.length ? missing.join(', ') : '없음 → 즉시 estimate 카드 제시'}
${svc.knowledge || ''}`
  return BASE_PROMPT + '\n\n' + ctx + '\n\n' + KNOWLEDGE_BASE
}

// ── 수집 완료 여부 체크 ───────────────────────────────────────
function isCollectionComplete(state) {
  const { service_type, collected = {} } = state || {}
  if (!service_type) return false
  const svc = SERVICES[service_type]
  if (!svc) return false
  return svc.steps.every(s => collected[s.field])
}

// ── 거리 기반 가격 (이사/용달) ────────────────────────────────
async function getDistanceKm(startAddr, endAddr, kakaoKey) {
  if (!kakaoKey) throw new Error('KAKAO_MOBILITY_REST_KEY 미설정')
  async function geocode(address) {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } })
    if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`)
    const data = await res.json()
    const doc = data?.documents?.[0]
    if (!doc) throw new Error(`주소 변환 실패: ${address}`)
    return { lng: Number(doc.x), lat: Number(doc.y) }
  }
  const [o, d] = await Promise.all([geocode(startAddr), geocode(endAddr)])
  const params = new URLSearchParams({ origin: `${o.lng},${o.lat}`, destination: `${d.lng},${d.lat}` })
  const res = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params}`, {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
  })
  if (!res.ok) throw new Error(`Directions HTTP ${res.status}`)
  const data = await res.json()
  const meter = data?.routes?.[0]?.summary?.distance
  if (Number.isFinite(meter)) return Math.round((meter / 1000) * 10) / 10
  // Haversine fallback
  const R = 6371
  const dLat = (d.lat - o.lat) * Math.PI / 180
  const dLon = (d.lng - o.lng) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(o.lat*Math.PI/180) * Math.cos(d.lat*Math.PI/180) * Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return Math.round(R * c * 1.25 * 10) / 10
}

async function calcMoveYongdal(serviceType, collected, kakaoKey) {
  const distKm = await getDistanceKm(collected.start_address, collected.end_address, kakaoKey)
  const floorStart = noElevator(collected.elevator_start) ? parseFloor(collected.floor) : 0
  const floorEnd = noElevator(collected.elevator_end) ? parseFloor(collected.floor_end) : 0
  const floorFee = (floorStart + floorEnd) * 5000
  const helperStr = String(collected.helper || '')
  const helperFee = serviceType === 'move'
    ? (helperStr.includes('+1인') ? 50000 : 0)
    : (helperStr.includes('동승') ? 20000 : (helperStr.includes('출발지') ? 10000 : (helperStr.includes('도착지') ? 10000 : 0)))
  const sizeBase = serviceType === 'yongdal'
    ? (String(collected.size || '').includes('중형') ? 30000 : String(collected.size || '').includes('대형') ? 50000 : 0)
    : 0
  const base = 30000
  const distFee = Math.round(distKm) * 1500
  const total = money(base + distFee + floorFee + sizeBase + helperFee)
  const breakdown = [
    { label: '기본 운임', amount: base },
    { label: `거리 (${distKm}km)`, amount: distFee },
  ]
  if (floorFee) breakdown.push({ label: `계단 이용 (${floorStart + floorEnd}층)`, amount: floorFee })
  if (sizeBase) breakdown.push({ label: `짐 규모 추가 (${collected.size})`, amount: sizeBase })
  if (helperFee) breakdown.push({ label: '보조/도움 옵션', amount: helperFee })
  const summary = [
    `출발지: ${collected.start_address}`,
    `도착지: ${collected.end_address}`,
    `거리: 약 ${distKm}km`,
    `이삿짐: ${collected.items || '-'}`,
    serviceType === 'move' ? `차량: ${collected.category || '-'}` : `짐 규모: ${collected.size || '-'}`,
  ]
  return { total, breakdown, summary }
}

// ── 가격 계산 (서비스 타입별) ─────────────────────────────────
async function calcPrice(serviceType, collected, kakaoKey) {
  if (serviceType === 'move' || serviceType === 'yongdal') {
    return calcMoveYongdal(serviceType, collected, kakaoKey)
  }
  return calculateServicePrice(serviceType, collected)
}

// ── estimate 카드 생성 ────────────────────────────────────────
function buildEstimateCard(priceResult, collected, serviceType) {
  const { total, breakdown, summary } = priceResult
  return {
    type: 'estimate',
    data: {
      total_price: total,
      deposit_amount: Math.round(total * 0.2),
      balance_amount: Math.round(total * 0.8),
      summary: summary || [],
      breakdown: breakdown || [],
      service_type: serviceType,
      collected,
    },
  }
}

// ── 카드 이벤트 처리 (GPT 없이) ──────────────────────────────
async function handleCardEvent(cardEvent, state, kakaoKey) {
  const svc = state.service_type ? SERVICES[state.service_type] : null
  if (!svc) return null

  const { type, field, value, address, detail, label, date, time } = cardEvent

  let updateField = field
  let updateValue = value

  if (type === 'address') {
    if (!updateField) {
      if (label === '출발지') updateField = 'start_address'
      else if (label === '도착지') updateField = 'end_address'
      else updateField = 'start_address'
    }
    updateValue = address || value || ''
  } else if (type === 'date') {
    updateField = 'date'
    updateValue = date || value || ''
  }

  if (!updateField) return null

  const newCollected = { ...state.collected, [updateField]: updateValue }
  if (type === 'address' && detail) newCollected[`${updateField}_detail`] = detail
  if (type === 'date' && time) newCollected.time = time

  const newState = { ...state, collected: newCollected, phase: 'collecting' }

  // 수집 완료 체크
  if (svc.steps.every(s => newCollected[s.field])) {
    try {
      const priceResult = await calcPrice(state.service_type, newCollected, kakaoKey)
      if (priceResult) {
        return ok({
          message: `모든 정보가 준비됐어요! 예상 견적은 **${priceResult.total.toLocaleString()}원**입니다. 아래에서 확인해주세요.`,
          card: buildEstimateCard(priceResult, newCollected, state.service_type),
          state: { ...newState, phase: 'estimate' },
        })
      }
    } catch { /* geocoding 실패 시 GPT fallback */ }
  }

  // 다음 수집 항목
  const nextStep = svc.steps.find(s => !newCollected[s.field])
  if (!nextStep) return null

  return ok({
    message: nextStep.q,
    card: nextStep.card || null,
    state: newState,
  })
}

// ── 핸들러 ───────────────────────────────────────────────────
export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt
  if (event.httpMethod !== 'POST') return fail('Method not allowed', null, 405)

  let body
  try { body = JSON.parse(event.body || '{}') }
  catch { return fail('Invalid JSON', null, 400) }

  const { messages = [], state = {}, conversationId, cardEvent } = body
  const apiKey = env('OPENAI_API_KEY', '')
  if (!apiKey) return fail('OpenAI API key not configured', null, 500)
  const kakaoKey = process.env.KAKAO_MOBILITY_REST_KEY || ''

  // 1. 카드 이벤트: GPT 없이 처리
  if (cardEvent) {
    const result = await handleCardEvent(cardEvent, state, kakaoKey)
    if (result) return result
    // fallthrough → GPT
  }

  // 2. 이미 수집 완료 상태면 서버가 즉시 estimate 반환
  if (isCollectionComplete(state) && state.service_type) {
    try {
      const priceResult = await calcPrice(state.service_type, state.collected, kakaoKey)
      if (priceResult) {
        return ok({
          message: `예상 견적은 **${priceResult.total.toLocaleString()}원**입니다.`,
          card: buildEstimateCard(priceResult, state.collected, state.service_type),
          state: { ...state, phase: 'estimate' },
        })
      }
    } catch { /* fallthrough */ }
  }

  if (!Array.isArray(messages)) return fail('messages must be an array', null, 400)

  try {
    const openai = new OpenAI({ apiKey })
    const systemContent = buildSystemPrompt(state) + `\n\n현재 상태:${JSON.stringify(state)}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    let response
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemContent },
          ...messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 600,
      }, { signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    const raw = response.choices[0]?.message?.content || '{}'
    let parsed
    try { parsed = JSON.parse(raw) }
    catch { parsed = { message: raw, card: null, state } }

    if (!parsed.message) parsed.message = '죄송해요, 다시 시도해주세요.'
    if (!parsed.state) parsed.state = state

    // 3. GPT 응답 후에도 수집 완료면 서버 estimate로 덮어쓰기
    if (isCollectionComplete(parsed.state) && parsed.state.service_type) {
      try {
        const priceResult = await calcPrice(parsed.state.service_type, parsed.state.collected, kakaoKey)
        if (priceResult) {
          parsed.card = buildEstimateCard(priceResult, parsed.state.collected, parsed.state.service_type)
          parsed.state.phase = 'estimate'
          parsed.message = `모든 정보가 준비됐어요! 예상 견적은 **${priceResult.total.toLocaleString()}원**입니다.`
        }
      } catch { /* geocoding 실패 시 AI estimate 유지 */ }
    }

    // 4. 수집 중이면 다음 step의 카드를 강제로 삽입 (GPT가 카드를 빠뜨리는 경우 대비)
    if (!parsed.card && parsed.state?.service_type && !isCollectionComplete(parsed.state)) {
      const svc = SERVICES[parsed.state.service_type]
      if (svc) {
        const nextStep = svc.steps.find(s => !parsed.state.collected?.[s.field])
        if (nextStep?.card) parsed.card = nextStep.card
      }
    }

    if (conversationId) {
      adminClient().from('ai_usage_logs').insert({
        conversation_id: conversationId,
        input_tokens: response.usage?.prompt_tokens,
        output_tokens: response.usage?.completion_tokens,
        model: 'gpt-4o-mini',
      }).then(() => {}).catch(() => {})
    }

    return ok(parsed)
  } catch (e) {
    console.error('[chat-ai]', e)
    return fail('AI 응답 실패', e.message, 500)
  }
}
