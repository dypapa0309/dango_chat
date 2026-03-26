import OpenAI from 'openai'
import { handleOptions, ok, fail } from '../../shared/http.js'
import { env } from '../../shared/env.js'
import { adminClient } from '../../shared/db.js'

const SYSTEM_PROMPT = `당신은 당고(DANG-O) AI 상담사입니다. 당고는 한국의 생활 서비스 플랫폼으로, 전문가를 연결해드립니다.

## 제공 서비스
- move (소형이사): 원룸·오피스텔 이사. 필요 정보: 날짜, 출발지, 도착지, 층수(엘베 없는 경우), 규모(원룸/투룸)
- clean (청소): 이사청소·가정청소. 필요 정보: 날짜, 주소, 평수, 청소 종류
- waste (폐기물 수거): 가구·가전 폐기. 필요 정보: 날짜, 주소, 폐기물 종류, 품목
- install (설치): 가구·가전·TV·조명 설치. 필요 정보: 날짜, 주소, 설치 종류, 수량
- errand (심부름): 배달·장보기·픽업. 필요 정보: 날짜, 주소, 종류
- organize (정리수납): 옷장·주방 정리. 필요 정보: 날짜, 주소, 정리 종류
- ac_clean (에어컨 청소): 벽걸이·스탠드·시스템. 필요 정보: 날짜, 주소, 에어컨 종류, 대수
- appliance_clean (가전 청소): 세탁기·냉장고·건조기. 필요 정보: 날짜, 주소, 가전 종류
- golf (골프 레슨): 스윙·숏게임 교정. 필요 정보: 날짜, 장소, 레슨 종류, 시간(30/60/90/120분)
- pt (PT): 개인 트레이닝. 필요 정보: 날짜, 장소, PT 종류, 시간
- counseling (심리상담): 개인·커플·가족 상담. 필요 정보: 날짜, 장소, 상담 종류, 시간
- marketing (마케팅): SNS·광고·콘텐츠 제작. 필요 정보: 시작 날짜, 종류

## 대화 규칙
1. 친근하고 간결하게 한국어로 응답
2. 한 번에 하나씩만 물어보기
3. 날짜/시간이 필요할 때 → card: {type: "date_picker"}
4. 주소가 필요할 때 → card: {type: "address_picker", data: {label: "출발지"}}
5. 서비스 파악 안 될 때 → card: {type: "service_select"}
6. 모든 필수 정보 수집 완료 → card: {type: "estimate", data: {...}} 와 함께 견적 제시
7. state.collected에 이미 수집된 정보는 다시 묻지 않기

## 견적 계산 (estimate 카드 data)
서비스별 기본 가격:
- 소형이사: 거리·층수 기반, 기본 150,000원~
- 청소(이사): 평수별, 20평 이하 150,000원~
- 폐기물: 품목별, 가구 1개 50,000원~
- 설치: 종류별, 가전 70,000원~
- 에어컨 청소: 벽걸이 56,000원, 스탠드 92,000원, 시스템 82,000원
- 심부름: 35,000원~
- 레슨류(골프/PT/상담): 60분 기준 60,000~120,000원
estimate 카드의 data.total_price, data.deposit_amount(20%), data.balance_amount(80%)를 포함해야 함

## 응답 형식 (항상 JSON)
{
  "message": "사용자에게 보낼 자연스러운 메시지",
  "card": null 또는 { "type": "date_picker"|"address_picker"|"service_select"|"estimate", "data": {} },
  "state": {
    "service_type": null 또는 서비스 key,
    "phase": "greeting"|"collecting"|"estimate"|"done",
    "collected": {
      "date": null 또는 날짜,
      "time": null 또는 시간,
      "start_address": null 또는 주소,
      "start_address_detail": null 또는 상세주소,
      "end_address": null 또는 주소,
      "category": null 또는 카테고리,
      "qty": null 또는 수량,
      "floor": null 또는 층수,
      "size": null 또는 평수,
      "duration": null 또는 시간(분),
      "customer_name": null 또는 이름,
      "customer_phone": null 또는 전화번호
    }
  }
}`

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt

  if (event.httpMethod !== 'POST') return fail('Method not allowed', null, 405)

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return fail('Invalid JSON', null, 400)
  }

  const { messages = [], state = {}, conversationId } = body

  if (!Array.isArray(messages)) return fail('messages must be an array', null, 400)

  const apiKey = env('OPENAI_API_KEY', '')
  if (!apiKey) return fail('OpenAI API key not configured', null, 500)

  try {
    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT + `\n\n## 현재 대화 상태\n${JSON.stringify(state, null, 2)}`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const raw = response.choices[0]?.message?.content || '{}'
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { message: raw, card: null, state: state }
    }

    // Validate required fields
    if (!parsed.message) parsed.message = '죄송해요, 다시 시도해주세요.'
    if (!parsed.state) parsed.state = state

    // Log usage to DB if conversationId provided (fire & forget)
    if (conversationId) {
      const sb = adminClient()
      sb.from('ai_usage_logs')
        .insert({
          conversation_id: conversationId,
          input_tokens: response.usage?.prompt_tokens,
          output_tokens: response.usage?.completion_tokens,
          model: 'gpt-4o',
        })
        .then(() => {})
        .catch(() => {})
    }

    return ok(parsed)
  } catch (e) {
    console.error('[chat-ai]', e)
    return fail('AI 응답 실패', e.message, 500)
  }
}

console.log('[ENV CHECK]', {
  openai: !!process.env.OPENAI_API_KEY,
  supabaseUrl: !!process.env.SUPABASE_URL,
  supabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY
})