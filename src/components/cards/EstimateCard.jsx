import { useState, useEffect } from 'react'
import { createJob, getRoutePrice } from '../../lib/api.js'
import { getServiceName } from '../../lib/services.js'
import PhoneVerifyModal from '../PhoneVerifyModal.jsx'

function fmt(n) {
  return Number(n).toLocaleString('ko-KR') + '원'
}

const DISTANCE_SERVICES = ['move', 'yongdal']

export default function EstimateCard({ data = {}, onSubmit, user, onLogin }) {
  const [paying, setPaying] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [routePrice, setRoutePrice] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifiedInfo, setVerifiedInfo] = useState(null)

  const {
    service_type,
    total_price: aiTotalPrice,
    deposit_amount: aiDepositAmount,
    balance_amount: aiBalanceAmount,
    breakdown: aiBreakdown,
    summary = [],
    collected = {},
    price_snapshot,
  } = data

  // For move/yongdal, fetch real road-distance-based pricing
  useEffect(() => {
    if (!DISTANCE_SERVICES.includes(service_type)) return
    const start = collected.start_address
    const end = collected.end_address
    if (!start || !end) return

    setRouteLoading(true)
    getRoutePrice({
      start,
      end,
      floor: collected.floor || 0,
      helper: collected.category === '기사 도움' || false,
    })
      .then(setRoutePrice)
      .catch(() => {}) // fall back to AI estimate silently
      .finally(() => setRouteLoading(false))
  }, [service_type, collected.start_address, collected.end_address, collected.floor])

  const total_price = routePrice?.total_price ?? aiTotalPrice
  const deposit_amount = routePrice?.deposit_amount ?? aiDepositAmount
  const balance_amount = routePrice?.balance_amount ?? aiBalanceAmount

  // breakdown: routePrice uses object format, AI uses array format
  const routeLines = routePrice?.breakdown
    ? Object.entries({
        '기본 요금': routePrice.breakdown.base,
        '거리 요금': routePrice.breakdown.distanceFee,
        '층수 요금': routePrice.breakdown.floorFee,
        '헬퍼 요금': routePrice.breakdown.helperFee,
        '옵션 요금': routePrice.breakdown.optionFee,
      })
        .filter(([, v]) => v > 0)
        .map(([label, amount]) => ({ label, amount }))
    : null
  const breakdownLines = routeLines ?? (Array.isArray(aiBreakdown) ? aiBreakdown : null)

  async function executePayment(customerName, customerPhone) {
    setPaying(true)
    setError('')
    try {
      const result = await createJob({
        service_type,
        price_override: {
          total: total_price,
          deposit: deposit_amount,
          balance: balance_amount,
        },
        move_date: collected.date || collected.move_date,
        start_address: collected.start_address,
        start_address_detail: collected.start_address_detail,
        end_address: collected.end_address,
        end_address_detail: collected.end_address_detail,
        customer_name: customerName,
        customer_phone: customerPhone,
        category: collected.category,
        qty: collected.qty,
        size: collected.size,
        floor: collected.floor,
        duration: collected.duration,
        price_snapshot,
        created_by: 'chat',
      })
      const jobId = result.job?.id || result.id
      if (!jobId) throw new Error('접수 ID를 받지 못했어요. 다시 시도해주세요.')
      setSubmitted(true)
      onSubmit?.('payment', { jobId })
    } catch (e) {
      setError(e.message || '접수 중 오류가 발생했어요.')
    } finally {
      setPaying(false)
    }
  }

  function handlePayment() {
    if (!user) { onLogin?.(); return }

    const isVerified = user?.user_metadata?.phone_verified || verifiedInfo
    if (!isVerified) {
      setShowVerifyModal(true)
      return
    }

    const name = verifiedInfo?.name || user?.user_metadata?.full_name || ''
    const phone = verifiedInfo?.phone || user?.user_metadata?.phone || ''
    executePayment(name, phone)
  }

  function handleVerified(info) {
    setVerifiedInfo(info)
    setShowVerifyModal(false)
    executePayment(info.name, info.phone)
  }

  if (submitted) {
    return (
      <div className="card estimate-card">
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)' }}>
          ✅ 접수 완료! 결제 페이지로 이동 중...
        </p>
      </div>
    )
  }

  return (
    <div className="card estimate-card">
      <div className="estimate-card__header">
        <span className="estimate-card__badge">견적</span>
        <span className="estimate-card__service">{getServiceName(service_type)}</span>
      </div>

      {/* Collected summary */}
      {summary.length > 0 && (
        <div className="estimate-card__summary">
          {summary.map((line, i) => (
            <p key={i} className="estimate-card__summary-line">{line}</p>
          ))}
        </div>
      )}

      {routeLoading && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
          실거리 계산 중...
        </p>
      )}
      {routePrice?.distance_km > 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
          실도로 거리 약 {routePrice.distance_km}km
        </p>
      )}

      {/* Breakdown lines */}
      {breakdownLines?.length > 0 && (
        <div className="estimate-card__rows">
          {breakdownLines.map((item, i) => (
            <div key={i} className="estimate-card__row">
              <span className="estimate-card__row-label">{item.label}</span>
              <span className="estimate-card__row-value">{fmt(item.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="estimate-card__total">
        <span className="estimate-card__total-label">총 금액</span>
        <span className="estimate-card__total-price">{fmt(total_price)}</span>
      </div>

      <p className="estimate-card__deposit-note">
        예약금 {fmt(deposit_amount)} 결제 후 전문가 배정 · 잔금 {fmt(balance_amount)}은 서비스 완료 후
      </p>

      {!user && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
          결제하려면 로그인이 필요해요.
        </p>
      )}

      {error && (
        <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 10 }}>{error}</p>
      )}

      <button className="card-btn" onClick={handlePayment} disabled={paying}>
        {!user ? '로그인하고 결제하기' : paying ? '처리 중...' : `예약금 ${fmt(deposit_amount)} 결제하기`}
      </button>
      <button className="card-btn card-btn--ghost" onClick={() => onSubmit?.('estimate_cancel', {})}>
        다시 견적 받기
      </button>

      {showVerifyModal && (
        <PhoneVerifyModal
          onVerified={handleVerified}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  )
}
