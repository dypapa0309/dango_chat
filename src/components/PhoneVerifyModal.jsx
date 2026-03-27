import { useState, useEffect, useRef } from 'react'
import { sendPhoneOtp, verifyPhoneOtp } from '../lib/api.js'

export default function PhoneVerifyModal({ onVerified, onClose }) {
  const [step, setStep] = useState(1) // 1: 이름+전화 입력, 2: OTP 입력
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)
  const otpRef = useRef(null)

  useEffect(() => {
    if (step === 2) otpRef.current?.focus()
  }, [step])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  function startCountdown() {
    setCountdown(60)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) { clearInterval(timerRef.current); return 0 }
        return v - 1
      })
    }, 1000)
  }

  function formatPhone(val) {
    const digits = val.replace(/[^0-9]/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`
    return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
  }

  async function handleSendOtp(e) {
    e?.preventDefault()
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!phone.trim()) { setError('전화번호를 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      await sendPhoneOtp({ name: name.trim(), phone })
      setStep(2)
      startCountdown()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e?.preventDefault()
    if (otp.length < 6) { setError('6자리 인증번호를 입력해주세요.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await verifyPhoneOtp({ otp })
      onVerified({ name: result.name, phone: result.phone })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal phone-verify-modal" onClick={(e) => e.stopPropagation()}>
        <button className="phone-verify-modal__close" onClick={onClose} aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {step === 1 ? (
          <>
            <p className="modal__title">연락처 인증</p>
            <p className="modal__desc">전문가 연결을 위해 이름과 연락처를 확인해주세요.</p>
            <form onSubmit={handleSendOtp} className="phone-verify-modal__form">
              <label className="phone-verify-modal__label">이름</label>
              <input
                className="phone-verify-modal__input"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                autoFocus
              />
              <label className="phone-verify-modal__label">휴대폰 번호</label>
              <input
                className="phone-verify-modal__input"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => { setPhone(formatPhone(e.target.value)); setError('') }}
                inputMode="numeric"
              />
              {error && <p className="phone-verify-modal__error">{error}</p>}
              <button className="modal__btn" type="submit" disabled={loading}>
                {loading ? '발송 중...' : '인증번호 받기'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="modal__title">인증번호 입력</p>
            <p className="modal__desc">
              {phone}으로 발송된<br />6자리 번호를 입력해주세요.
            </p>
            <form onSubmit={handleVerify} className="phone-verify-modal__form">
              <input
                ref={otpRef}
                className="phone-verify-modal__input phone-verify-modal__input--otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setError('') }}
                inputMode="numeric"
                maxLength={6}
              />
              {error && <p className="phone-verify-modal__error">{error}</p>}
              <button className="modal__btn" type="submit" disabled={loading || otp.length < 6}>
                {loading ? '확인 중...' : '확인'}
              </button>
              <button
                className="modal__btn modal__btn--ghost"
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `재발송 (${countdown}초)` : '인증번호 재발송'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
