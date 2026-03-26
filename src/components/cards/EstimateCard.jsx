import { useState } from 'react'
import { createJob } from '../../lib/api.js'
import { getServiceName } from '../../lib/services.js'

function fmt(n) {
  return Number(n).toLocaleString('ko-KR') + '원'
}

export default function EstimateCard({ data = {}, onSubmit }) {
  const [paying, setPaying] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const {
    service_type,
    total_price,
    deposit_amount,
    balance_amount,
    breakdown = {},
    collected = {},
    price_snapshot,
  } = data

  async function handlePayment() {
    setPaying(true)
    setError('')
    try {
      const result = await createJob({
        service_type,
        total_price,
        deposit_amount,
        balance_amount,
        price_snapshot,
        ...collected,
        created_by: 'chat',
      })
      const jobId = result.job?.id || result.id
      setSubmitted(true)
      onSubmit?.('payment', { jobId })
    } catch (e) {
      setError(e.message || '접수 중 오류가 발생했어요.')
    } finally {
      setPaying(false)
    }
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

      {/* Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="estimate-card__rows">
          {breakdown.base > 0 && (
            <div className="estimate-card__row">
              <span className="estimate-card__row-label">기본 요금</span>
              <span className="estimate-card__row-value">{fmt(breakdown.base)}</span>
            </div>
          )}
          {breakdown.distanceFee > 0 && (
            <div className="estimate-card__row">
              <span className="estimate-card__row-label">거리 요금</span>
              <span className="estimate-card__row-value">{fmt(breakdown.distanceFee)}</span>
            </div>
          )}
          {breakdown.floorFee > 0 && (
            <div className="estimate-card__row">
              <span className="estimate-card__row-label">층수 요금</span>
              <span className="estimate-card__row-value">{fmt(breakdown.floorFee)}</span>
            </div>
          )}
          {breakdown.helperFee > 0 && (
            <div className="estimate-card__row">
              <span className="estimate-card__row-label">헬퍼 요금</span>
              <span className="estimate-card__row-value">{fmt(breakdown.helperFee)}</span>
            </div>
          )}
          {breakdown.optionFee > 0 && (
            <div className="estimate-card__row">
              <span className="estimate-card__row-label">옵션 요금</span>
              <span className="estimate-card__row-value">{fmt(breakdown.optionFee)}</span>
            </div>
          )}
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

      {error && (
        <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 10 }}>{error}</p>
      )}

      <button className="card-btn" onClick={handlePayment} disabled={paying}>
        {paying ? '처리 중...' : `예약금 ${fmt(deposit_amount)} 결제하기`}
      </button>
      <button className="card-btn card-btn--ghost" onClick={() => onSubmit?.('estimate_cancel', {})}>
        다시 견적 받기
      </button>
    </div>
  )
}
