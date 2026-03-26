import { useState, useEffect } from 'react'

export default function AddressCard({ data = {}, onSubmit }) {
  const [address, setAddress] = useState(data.defaultAddress || '')
  const [detail, setDetail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(!!window.daum?.Postcode)

  // Load Kakao Postcode API
  useEffect(() => {
    if (window.daum?.Postcode) { setKakaoReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => setKakaoReady(true)
    document.head.appendChild(script)
  }, [])

  function openSearch() {
    if (!window.daum?.Postcode) return
    new window.daum.Postcode({
      oncomplete(result) {
        setAddress(result.roadAddress || result.jibunAddress)
      },
    }).open()
  }

  function handleConfirm() {
    if (!address.trim()) return
    setSubmitted(true)
    onSubmit?.('address', {
      address: address.trim(),
      detail: detail.trim(),
      label: data.label || '주소',
    })
  }

  if (submitted) {
    return (
      <div className="card">
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          ✅ {address}{detail ? ` ${detail}` : ''} 입력 완료
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="card__title">📍 {data.label || '주소'} 입력</p>
      <div className="address-card__input-wrap">
        <input
          type="text"
          className="address-card__input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="주소를 검색하거나 직접 입력"
          onClick={kakaoReady ? openSearch : undefined}
          readOnly={kakaoReady}
        />
        <button className="address-card__search-btn" onClick={openSearch} type="button">
          검색
        </button>
      </div>
      <input
        type="text"
        className="address-card__detail"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="상세 주소 (동, 호수 등)"
      />
      <button
        className="card-btn"
        onClick={handleConfirm}
        disabled={!address.trim()}
      >
        확인
      </button>
    </div>
  )
}
