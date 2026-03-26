import { useState, useEffect, useRef } from 'react'

export default function AddressCard({ data = {}, onSubmit }) {
  const [address, setAddress] = useState(data.defaultAddress || '')
  const [detail, setDetail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(!!window.daum?.Postcode)
  const [showEmbed, setShowEmbed] = useState(false)
  const embedRef = useRef(null)

  // Load Kakao Postcode API
  useEffect(() => {
    if (window.daum?.Postcode) { setKakaoReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.onload = () => setKakaoReady(true)
    document.head.appendChild(script)
  }, [])

  // Mount embed widget when showEmbed becomes true
  useEffect(() => {
    if (!showEmbed || !kakaoReady || !embedRef.current) return
    embedRef.current.innerHTML = ''
    new window.daum.Postcode({
      oncomplete(result) {
        setAddress(result.roadAddress || result.jibunAddress)
        setShowEmbed(false)
      },
      onclose() {
        setShowEmbed(false)
      },
      width: '100%',
      height: '100%',
    }).embed(embedRef.current, { autoClose: true })
  }, [showEmbed, kakaoReady])

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

      {showEmbed ? (
        <div className="address-card__embed-wrap">
          <div ref={embedRef} className="address-card__embed" />
          <button
            className="card-btn card-btn--ghost"
            style={{ marginTop: 8 }}
            onClick={() => setShowEmbed(false)}
            type="button"
          >
            닫기
          </button>
        </div>
      ) : (
        <>
          <div className="address-card__input-wrap">
            <input
              type="text"
              className="address-card__input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소를 검색하거나 직접 입력"
              readOnly={kakaoReady}
              onClick={kakaoReady ? () => setShowEmbed(true) : undefined}
            />
            <button
              className="address-card__search-btn"
              onClick={() => setShowEmbed(true)}
              type="button"
            >
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
        </>
      )}
    </div>
  )
}
