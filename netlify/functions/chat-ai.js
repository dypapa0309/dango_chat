import OpenAI from 'openai'
import { handleOptions, ok, fail } from '../../shared/http.js'
import { env } from '../../shared/env.js'
import { adminClient } from '../../shared/db.js'
import { SERVICES, SERVICE_SUMMARY } from './_data/services/index.js'

const BASE_PROMPT = `당신은 당고(DANG-O) AI 상담사입니다. 친근하고 자연스러운 한국어로 대화하세요.

## 핵심 규칙
1. 한 번에 하나씩만 물어보기
2. 이미 수집된 정보는 절대 다시 묻지 않기
3. 카드 UI는 서버가 자동으로 붙임 → message에 선택지 나열 불필요
4. 사용자가 텍스트로 답하면 현재 물어보는 field에 매핑해서 updates에 포함
5. 사용자가 이전 답변을 수정하려 하면("아 잠깐", "바꿀게요" 등) updates에 수정값 포함
6. 수집 중 서비스 관련 질문이 오면 1~2문장 답 후 수집 흐름으로 복귀

## 텍스트 입력 → updates 매핑 예시
- "두 대요" / "2개" / "둘" → updates: {"qty": "2대"}
- "냄새가 좀 나요" → updates: {"condition": "냄새남"}
- "거실이랑 안방" → updates: {"qty": "2공간"}
- "아 스탠드예요" (이전에 벽걸이) → updates: {"category": "스탠드"}

## 중간 질문 처리 예시
user: "분해청소랑 기본청소 차이가 뭐예요?"
→ collect_info(message="분해청소는 에어컨을 완전히 분리해 내부 세균·곰팡이까지 제거해요. 기본청소보다 효과가 훨씬 좋지만 50% 정도 비용이 추가돼요. 어떤 방식으로 진행할까요?", updates={})

## Few-shot 예시

### 예시 1 — 카드 선택 후 다음 질문
user: "벽걸이"
→ collect_info(message="벽걸이 선택하셨군요! 몇 대 청소할까요?", updates={"category":"벽걸이"})

### 예시 2 — 텍스트 답변
user: "2대 있어요"
→ collect_info(message="기본 청소로 진행할까요, 아니면 내부까지 꼼꼼히 하는 분해 청소를 원하시나요?", updates={"qty":"2대"})

### 예시 3 — 이전 답변 수정
user: "아 잠깐, 에어컨이 스탠드예요"
→ collect_info(message="네, 스탠드로 수정할게요! 몇 대 청소할까요?", updates={"category":"스탠드"})

### 예시 4 — 서비스 파악
user: "에어컨 청소하고 싶어요"
→ collect_info(message="에어컨 청소 도와드릴게요! 어떤 종류의 에어컨인가요?", service_type="ac_clean", updates={})`

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

// ── Function calling 스키마 ────────────────────────────────────
const COLLECT_FUNCTION = {
  name: 'collect_info',
  description: '사용자 응답을 분석해 서비스 예약 정보를 수집하고 다음 메시지를 생성합니다',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '사용자에게 전달할 자연스러운 한국어 메시지',
      },
      service_type: {
        type: 'string',
        description: '서비스 유형 (service_type이 아직 없을 때만). 예: "ac_clean", "move", "clean", "yongdal"',
      },
      updates: {
        type: 'object',
        description: '이번 응답에서 새로 수집된 field-value 쌍. 예: {"category": "벽걸이", "qty": "2대"}',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['message'],
  },
}

// ── 입력값 검증: 불가능한 값 감지 ────────────────────────────
function validateFieldValue(serviceType, field, value) {
  const n = parseFloat(String(value))
  // 면적
  if (field === 'area') {
    if (!isNaN(n) && n > 200) return `${n}평은 입력하기 너무 큰 면적이에요. 실제 평수를 다시 알려주세요.`
    if (!isNaN(n) && n <= 0) return '면적을 다시 입력해주세요.'
  }
  // 수량 (대, 개, 공간 등)
  if (['qty', 'items_count', 'bathroom_count', 'balcony_count'].includes(field)) {
    const q = parseInt(String(value))
    if (!isNaN(q) && q > 50) return `${q}${field === 'qty' ? '대' : '개'}는 너무 많아요. 다시 확인해주세요.`
    if (!isNaN(q) && q <= 0) return '1 이상의 값을 입력해주세요.'
  }
  // 층수
  if (['floor', 'floor_end'].includes(field)) {
    const f = parseInt(String(value))
    if (!isNaN(f) && f > 80) return `${f}층은 너무 높아요. 층수를 다시 알려주세요.`
    if (!isNaN(f) && f < 0) return '올바른 층수를 입력해주세요.'
  }
  return null // 유효
}

// ── 유틸 ─────────────────────────────────────────────────────
function parseFloor(val) {
  if (!val) return 0
  const n = parseInt(String(val))
  return Number.isFinite(n) && n > 0 ? n : 0
}
function noElevator(val) { return String(val || '').includes('없음') }
function money(n) { return Math.round(n / 1000) * 1000 }

// ── collected 자연어 요약 ──────────────────────────────────────
function buildCollectedSummary(service_type, collected) {
  if (!service_type || !SERVICES[service_type] || !collected) return '없음'
  const svc = SERVICES[service_type]
  const lines = svc.steps
    .filter(s => collected[s.field])
    .map(s => `  • ${s.field}: ${collected[s.field]}`)
  return lines.length ? lines.join('\n') : '없음'
}

// ── 프롬프트 동적 생성 ────────────────────────────────────────
function buildSystemPrompt(state) {
  const { service_type, collected = {} } = state || {}
  if (!service_type || !SERVICES[service_type]) {
    return BASE_PROMPT + '\n\n' + SERVICE_SUMMARY + '\n\n' + KNOWLEDGE_BASE
  }
  const svc = SERVICES[service_type]
  const missingSteps = svc.steps.filter(s => !collected[s.field])
  const nextStep = missingSteps[0]

  const ctx = `## 현재 서비스: ${svc.name}

## 지금까지 수집된 정보
${buildCollectedSummary(service_type, collected)}

## 지금 물어볼 항목
${nextStep ? `field="${nextStep.field}" → "${nextStep.q}"` : '없음 (수집 완료)'}

## 아직 남은 항목
${missingSteps.length ? missingSteps.map(s => s.field).join(', ') : '없음'}

${svc.knowledge || ''}`
  return BASE_PROMPT + '\n\n' + ctx + '\n\n' + KNOWLEDGE_BASE
}

// ── 입력 전처리: 한국어 숫자·비공식 표현 정규화 ──────────────
function normalizeInput(text) {
  if (!text) return text
  return text
    .replace(/\b하나\b|한\s*개|한\s*대/g, '1')
    .replace(/\b둘\b|두\s*개|두\s*대/g, '2')
    .replace(/\b셋\b|세\s*개|세\s*대/g, '3')
    .replace(/\b넷\b|네\s*개|네\s*대/g, '4')
    .replace(/\b다섯\b/g, '5')
    .replace(/없어요|없는데요|없습니다/g, '없음')
    .replace(/있어요|있는데요|있습니다/g, '있음')
    .replace(/(\d+)\s*평\s*정도/g, '$1평')
    .replace(/모르겠어요|잘\s*모르겠|모르는데요/g, '모름')
}

// ── Semantic matching: 텍스트 → 현재 step 선택지 자동 매핑 ────
function semanticMatch(text, state) {
  const { service_type, collected = {} } = state || {}
  if (!service_type || !SERVICES[service_type]) return null
  const svc = SERVICES[service_type]
  const nextStep = svc.steps.find(s => !collected[s.field])
  if (!nextStep?.card?.data?.options) return null

  const normalized = text.toLowerCase().replace(/\s/g, '')
  const options = nextStep.card.data.options

  // 정확히 포함되는 옵션 우선
  for (const opt of options) {
    const optClean = opt.replace(/\s*\(.*?\)/g, '').trim() // 괄호 제거
    if (normalized.includes(optClean.toLowerCase().replace(/\s/g, ''))) {
      return { field: nextStep.field, value: opt }
    }
  }
  // 숫자 매핑 (1대, 2대 등)
  const numMatch = text.match(/(\d+)\s*(대|개|공간|층|평|인|회)/)
  if (numMatch) {
    const target = `${numMatch[1]}${numMatch[2]}`
    const matched = options.find(o => o.startsWith(target) || o.includes(target))
    if (matched) return { field: nextStep.field, value: matched }
  }
  return null
}

// ── 다음 카드 결정 (서버가 직접) ──────────────────────────────
function getNextCard(state) {
  const { service_type, collected = {} } = state || {}
  if (!service_type || !SERVICES[service_type]) return null
  const svc = SERVICES[service_type]
  const nextStep = svc.steps.find(s => !collected[s.field])
  return nextStep?.card || null
}

// ── 부분 견적 미리보기 ────────────────────────────────────────
function buildPartialPriceHint(service_type, collected) {
  if (!service_type || !SERVICES[service_type]) return ''
  const svc = SERVICES[service_type]
  const filled = svc.steps.filter(s => collected[s.field]).length
  const total = svc.steps.length
  // 주요 필드(50% 이상) 채워졌을 때만 힌트 제공
  if (filled < Math.ceil(total * 0.5)) return ''
  try {
    const result = calculateServicePrice(service_type, collected)
    if (!result?.total) return ''
    const low = Math.round(result.total * 0.9 / 1000) * 1000
    const high = Math.round(result.total * 1.1 / 1000) * 1000
    return `\n\n💡 현재까지 입력 기준 예상 범위: **${low.toLocaleString()}~${high.toLocaleString()}원**`
  } catch { return '' }
}

// ── 대화 요약 히스토리 구성 ───────────────────────────────────
function buildMessageHistory(messages) {
  const msgs = Array.isArray(messages) ? messages : []
  if (msgs.length <= 6) return msgs.slice(-10)

  // 오래된 메시지는 요약, 최근 4턴은 raw 유지
  const recent = msgs.slice(-4)
  const old = msgs.slice(0, -4)
  const summaryLines = old
    .filter(m => m.content?.trim())
    .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content.slice(0, 60)}`)
    .join(' / ')
  const summaryMsg = { role: 'system', content: `[이전 대화 요약] ${summaryLines}` }
  return [summaryMsg, ...recent]
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
  if (!Number.isFinite(distKm) || distKm < 0) throw new Error('거리 계산 실패')
  const floorStart = noElevator(collected.elevator_start) ? parseFloor(collected.floor) : 0
  const floorEnd = noElevator(collected.elevator_end) ? parseFloor(collected.floor_end) : 0
  const floorFee = (floorStart + floorEnd) * 5000
  const helperStr = String(collected.helper || '')
  const helperFee = serviceType === 'move'
    ? (helperStr.includes('+1인') ? 50000 : 0)
    : (helperStr.includes('동승') ? 20000 : (helperStr.includes('출발지') ? 10000 : (helperStr.includes('도착지') ? 10000 : 0)))

  // 용달: 차량 크기 추가 요금
  const vehicleStr = String(collected.vehicle_size || '')
  const vehicleFee = serviceType === 'yongdal'
    ? (vehicleStr.includes('2.5톤') ? 50000 : vehicleStr.includes('1.4톤') ? 20000 : 0)
    : 0

  // 소형이사: 포장 서비스
  const packingStr = String(collected.packing || '')
  const packingMultiplier = packingStr.includes('포장이사') ? 1.5 : packingStr.includes('반포장') ? 1.3 : 1.0

  // 소형이사: 특수 품목
  const specialStr = String(collected.special_items || '')
  let specialFee = 0
  if (specialStr.includes('피아노')) specialFee += 80000
  if (specialStr.includes('금고')) specialFee += 50000
  if (specialStr.includes('에어컨')) specialFee += 50000

  const base = 30000
  const distFee = Math.round(distKm) * 1500
  const subtotal = money((base + distFee + floorFee + vehicleFee) * packingMultiplier)
  const total = money(subtotal + helperFee + specialFee)

  const breakdown = [
    { label: '기본 운임', amount: base },
    { label: `거리 (${distKm}km)`, amount: distFee },
  ]
  if (floorFee) breakdown.push({ label: `계단 이용 (${floorStart + floorEnd}층)`, amount: floorFee })
  if (vehicleFee) breakdown.push({ label: `차량 추가 (${vehicleStr})`, amount: vehicleFee })
  if (packingMultiplier > 1) breakdown.push({ label: `포장 서비스 (×${packingMultiplier})`, amount: subtotal - money((base + distFee + floorFee + vehicleFee)) })
  if (helperFee) breakdown.push({ label: '보조/도움 옵션', amount: helperFee })
  if (specialFee) breakdown.push({ label: '특수 품목', amount: specialFee })

  const summary = [
    `출발지: ${collected.start_address}`,
    `도착지: ${collected.end_address}`,
    `거리: 약 ${distKm}km`,
    serviceType === 'move' ? `이사 방식: ${collected.packing || '일반이사'}` : `차량: ${vehicleStr || '-'}`,
    serviceType === 'move' ? `차량: ${collected.category || '-'}` : `품목: ${collected.items || '-'}`,
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

// ── 카드 이벤트 처리: state 업데이트 후 GPT로 넘김 ──────────
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
  } else if (type === 'multi_select') {
    // field and value already set from destructuring
  }

  if (!updateField) return null

  const newCollected = { ...state.collected, [updateField]: updateValue }
  if (type === 'address' && detail) newCollected[`${updateField}_detail`] = detail
  if (type === 'date' && time) newCollected.time = time

  const newState = { ...state, collected: newCollected, phase: 'collecting' }

  // 수집 완료 시에만 서버가 직접 estimate 반환
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

  // 미완료: 업데이트된 state를 body에 반영해 GPT로 넘김
  return { __updatedState: newState }
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

  // 1. 카드 이벤트: state 업데이트 후 GPT로 넘김
  let effectiveState = state
  if (cardEvent) {
    const result = await handleCardEvent(cardEvent, state, kakaoKey)
    if (result?.__updatedState) effectiveState = result.__updatedState
    else if (result) return result  // estimate 카드 직접 반환
  }

  // 2. 수집 완료 상태면 서버가 즉시 estimate 반환
  if (isCollectionComplete(effectiveState) && effectiveState.service_type) {
    try {
      const priceResult = await calcPrice(effectiveState.service_type, effectiveState.collected, kakaoKey)
      if (priceResult) {
        return ok({
          message: `예상 견적은 **${priceResult.total.toLocaleString()}원**입니다.`,
          card: buildEstimateCard(priceResult, effectiveState.collected, effectiveState.service_type),
          state: { ...effectiveState, phase: 'estimate' },
        })
      }
    } catch { /* fallthrough → GPT */ }
  }

  if (!Array.isArray(messages)) return fail('messages must be an array', null, 400)

  // 3. 입력 전처리: 마지막 사용자 메시지 정규화
  const lastUserMsg = messages[messages.length - 1]
  if (lastUserMsg?.role === 'user') {
    lastUserMsg.content = normalizeInput(lastUserMsg.content)
  }

  // 4. Semantic matching: 텍스트가 현재 step 선택지와 일치하면 직접 collected 업데이트
  let semanticMatched = null
  if (!cardEvent && lastUserMsg?.role === 'user') {
    semanticMatched = semanticMatch(lastUserMsg.content, effectiveState)
    if (semanticMatched) {
      effectiveState = {
        ...effectiveState,
        collected: { ...effectiveState.collected, [semanticMatched.field]: semanticMatched.value },
        phase: 'collecting',
      }
    }
  }

  // 수집 완료 재체크 (semantic match 후)
  if (isCollectionComplete(effectiveState) && effectiveState.service_type) {
    try {
      const priceResult = await calcPrice(effectiveState.service_type, effectiveState.collected, kakaoKey)
      if (priceResult) {
        return ok({
          message: `모든 정보가 준비됐어요! 예상 견적은 **${priceResult.total.toLocaleString()}원**입니다.`,
          card: buildEstimateCard(priceResult, effectiveState.collected, effectiveState.service_type),
          state: { ...effectiveState, phase: 'estimate' },
        })
      }
    } catch { /* fallthrough */ }
  }

  // 다음 step field 추적 (검증용)
  const expectedField = (() => {
    const { service_type, collected = {} } = effectiveState
    if (!service_type || !SERVICES[service_type]) return null
    return SERVICES[service_type].steps.find(s => !collected[s.field])?.field || null
  })()

  try {
    const openai = new OpenAI({ apiKey })
    const systemContent = buildSystemPrompt(effectiveState)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    async function callGpt(extraInstruction = '') {
      const sysMsg = extraInstruction ? systemContent + '\n\n⚠️ ' + extraInstruction : systemContent
      const historyMsgs = buildMessageHistory(messages)
      return openai.chat.completions.create({
        model: 'gpt-4o',
        tools: [{ type: 'function', function: COLLECT_FUNCTION }],
        tool_choice: { type: 'function', function: { name: 'collect_info' } },
        messages: [
          { role: 'system', content: sysMsg },
          ...historyMsgs.map(m => ({ role: m.role === 'user' ? 'user' : m.role === 'system' ? 'system' : 'assistant', content: m.content })),
        ],
        temperature: 0.5,
        max_tokens: 500,
      }, { signal: controller.signal })
    }

    let response
    try {
      response = await callGpt()
    } finally {
      clearTimeout(timeoutId)
    }

    // 5. Function call 결과 파싱
    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    let fnResult = {}
    try { fnResult = JSON.parse(toolCall?.function?.arguments || '{}') } catch {}

    // 서비스 타입 새로 파악된 경우 반영
    if (fnResult.service_type && !effectiveState.service_type) {
      effectiveState = { ...effectiveState, service_type: fnResult.service_type, phase: 'collecting' }
    }

    // GPT가 수집한 updates 검증 후 병합
    if (fnResult.updates && typeof fnResult.updates === 'object') {
      const validated = {}
      const validationErrors = []
      for (const [field, value] of Object.entries(fnResult.updates)) {
        const err = validateFieldValue(effectiveState.service_type, field, value)
        if (err) validationErrors.push(err)
        else validated[field] = value
      }
      effectiveState = {
        ...effectiveState,
        collected: { ...(effectiveState.collected || {}), ...validated },
        phase: 'collecting',
      }
      // 검증 오류 있으면 메시지 앞에 경고 추가
      if (validationErrors.length) {
        fnResult.message = validationErrors[0] + ' ' + (fnResult.message || '')
      }
    }

    // 예상 field 미반영 시 1회 재시도
    if (expectedField && !effectiveState.collected?.[expectedField]) {
      try {
        const retryResponse = await callGpt(
          `사용자의 마지막 메시지는 "${expectedField}" 필드에 대한 답변입니다. updates에 반드시 포함하세요.`
        )
        const retryCall = retryResponse.choices[0]?.message?.tool_calls?.[0]
        const retryResult = JSON.parse(retryCall?.function?.arguments || '{}')
        if (retryResult.updates?.[expectedField]) {
          effectiveState = {
            ...effectiveState,
            collected: { ...effectiveState.collected, [expectedField]: retryResult.updates[expectedField] },
          }
          if (retryResult.message) fnResult.message = retryResult.message
        }
      } catch { /* 재시도 실패 시 원본 유지 */ }
    }

    // semantic match로 업데이트된 필드는 서버가 보장
    if (semanticMatched) {
      effectiveState = {
        ...effectiveState,
        collected: { ...(effectiveState.collected || {}), [semanticMatched.field]: semanticMatched.value },
      }
    }

    let parsed = { message: fnResult.message || '죄송해요, 다시 시도해주세요.', card: null, state: effectiveState }

    // 6. 수집 완료면 estimate, 아니면 서버가 다음 카드 직접 결정
    if (isCollectionComplete(effectiveState) && effectiveState.service_type) {
      try {
        const priceResult = await calcPrice(effectiveState.service_type, effectiveState.collected, kakaoKey)
        if (priceResult) {
          parsed.card = buildEstimateCard(priceResult, effectiveState.collected, effectiveState.service_type)
          parsed.state = { ...effectiveState, phase: 'estimate' }
          parsed.message = `모든 정보가 준비됐어요! 예상 견적은 **${priceResult.total.toLocaleString()}원**입니다.`
        }
      } catch { /* geocoding 실패 시 메시지만 반환 */ }
    } else {
      parsed.card = getNextCard(effectiveState)
      // 부분 견적 미리보기 힌트 (move/yongdal 제외 — 거리 계산 필요)
      if (!['move', 'yongdal'].includes(effectiveState.service_type)) {
        const hint = buildPartialPriceHint(effectiveState.service_type, effectiveState.collected || {})
        if (hint) parsed.message = parsed.message + hint
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
