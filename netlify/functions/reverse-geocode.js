import { handleOptions, ok, fail } from '../../shared/http.js'

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt

  const { lat, lng } = event.queryStringParameters || {}
  if (!lat || !lng) return fail('lat, lng 필수', null, 400)

  const kakaoKey = process.env.KAKAO_MOBILITY_REST_KEY
  if (!kakaoKey) return fail('Kakao key 미설정', null, 500)

  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`
    const res = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } })
    if (!res.ok) throw new Error(`Kakao HTTP ${res.status}`)
    const data = await res.json()
    const doc = data?.documents?.[0]
    const address = doc?.road_address?.address_name || doc?.address?.address_name || ''
    if (!address) return fail('주소를 찾지 못했어요', null, 404)
    return ok({ address })
  } catch (e) {
    return fail('역지오코딩 실패', e.message, 500)
  }
}
