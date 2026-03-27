import { useState, useEffect, useRef } from 'react'

export default function AddressCard({ data = {}, onSubmit }) {
  const [address, setAddress] = useState(data.defaultAddress || '')
  const [detail, setDetail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(!!window.daum?.Postcode)
  const [showEmbed, setShowEmbed] = useState(false)
  const [locStatus, setLocStatus] = useState('') // '' | 'loading' | 'notfound' | 'error' | 'denied'
  const embedRef = useRef(null)
  const savedAddresses = data.savedAddresses || []

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

  async function handleCurrentLocation() {
    if (!navigator.geolocation) {
      setLocStatus('error')
      setTimeout(() => setLocStatus(''), 4000)
      return
    }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const res = await fetch(`/.netlify/functions/reverse-geocode?lat=${lat}&lng=${lng}`)
          const data = await res.json()
          if (data.address) {
            setAddress(data.address)
            setLocStatus('')
          } else {
            setLocStatus(res.status === 404 ? 'notfound' : 'error')
            setTimeout(() => setLocStatus(''), 4000)
          }
        } catch {
          setLocStatus('error')
          setTimeout(() => setLocStatus(''), 4000)
        }
      },
      (err) => {
        setLocStatus(err.code === 1 ? 'denied' : 'error')
        setTimeout(() => setLocStatus(''), 5000)
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
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
          {savedAddresses.length > 0 && (
            <div className="address-card__saved">
              <p className="address-card__saved-label">최근 주소</p>
              {savedAddresses.slice(0, 3).map((saved, i) => (
                <button
                  key={i}
                  className="address-card__saved-btn"
                  type="button"
                  onClick={() => {
                    setSubmitted(true)
                    onSubmit?.('address', {
                      address: saved.address,
                      detail: saved.detail || '',
                      label: data.label || '주소',
                    })
                  }}
                >
                  📍 {saved.address}{saved.detail ? ` ${saved.detail}` : ''}
                </button>
              ))}
            </div>
          )}
          <button
            className="address-card__location-btn"
            type="button"
            onClick={handleCurrentLocation}
            disabled={locStatus === 'loading'}
          >
            {locStatus === 'loading' ? '📍 위치 찾는 중...' : '📍 현재 위치 사용'}
          </button>
          {locStatus === 'denied' && (
            <p className="address-card__loc-err">위치 권한이 차단되어 있어요. 브라우저 주소창의 자물쇠 아이콘을 눌러 허용해주세요.</p>
          )}
          {locStatus === 'notfound' && (
            <p className="address-card__loc-err">현재 위치 주소를 찾지 못했어요. 직접 검색해주세요.</p>
          )}
          {locStatus === 'error' && (
            <p className="address-card__loc-err">위치를 가져오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          )}
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
