/**
 * GET /.netlify/functions/get-route-price?start=주소&end=주소&floor=0&helper=0
 *
 * 1. Kakao Local API로 주소 → 좌표 변환
 * 2. Kakao Mobility로 실도로 거리(km) 계산
 * 3. shared/price.js로 가격 산출 후 반환
 */
import { calculatePrice } from '../../shared/price.js'
import { handleOptions } from '../../shared/http.js'

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function jsonRes(statusCode, body) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) }
}

async function geocode(address, key) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`)
  const data = await res.json()
  const doc = data?.documents?.[0]
  if (!doc) throw new Error(`주소를 찾을 수 없어요: ${address}`)
  return { lng: doc.x, lat: doc.y }  // x=경도, y=위도
}

async function getRoadDistanceKm(origin, destination, key) {
  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
  })
  const url = `https://apis-navi.kakaomobility.com/v1/directions?${params}`
  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
  if (!res.ok) throw new Error(`Directions HTTP ${res.status}`)
  const data = await res.json()
  const meter = data?.routes?.[0]?.summary?.distance
  if (!Number.isFinite(meter)) {
    // Haversine fallback with 1.25x road correction
    const R = 6371
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180
    const dLon = ((destination.lng - origin.lng) * Math.PI) / 180
    const lat1 = (origin.lat * Math.PI) / 180
    const lat2 = (destination.lat * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
    const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(straightKm * 1.25 * 10) / 10
  }
  return Math.round((meter / 1000) * 10) / 10
}

export async function handler(event) {
  const opt = handleOptions(event)
  if (opt) return opt

  if (event.httpMethod !== 'GET') return jsonRes(405, { error: 'GET only' })

  const { start, end, floor = '0', helper = '0' } = event.queryStringParameters || {}
  if (!start || !end) return jsonRes(400, { error: 'start/end 주소가 필요합니다' })

  const key = process.env.KAKAO_MOBILITY_REST_KEY
  if (!key) return jsonRes(500, { error: 'KAKAO_MOBILITY_REST_KEY not set' })

  try {
    const [origin, destination] = await Promise.all([geocode(start, key), geocode(end, key)])
    const distanceKm = await getRoadDistanceKm(origin, destination, key)

    const price = calculatePrice({
      distanceKm,
      floor: Number(floor) || 0,
      options: { helper: helper === '1' },
    })

    return jsonRes(200, {
      distance_km: distanceKm,
      total_price: price.total,
      deposit_amount: price.deposit,
      balance_amount: price.balance,
      breakdown: {
        base: price.base,
        distanceFee: price.distanceFee,
        floorFee: price.floorFee,
        helperFee: price.helperFee,
      },
    })
  } catch (e) {
    return jsonRes(500, { error: e.message })
  }
}
