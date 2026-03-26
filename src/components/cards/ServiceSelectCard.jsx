import { useState } from 'react'
import { SERVICE_LIST } from '../../lib/services.js'

export default function ServiceSelectCard({ data = {}, onSubmit }) {
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState(null)

  const services = data.services
    ? SERVICE_LIST.filter((s) => data.services.includes(s.key))
    : SERVICE_LIST

  if (submitted) {
    const svc = SERVICE_LIST.find((s) => s.key === selected)
    return (
      <div className="card">
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          ✅ {svc?.emoji} {svc?.name} 선택 완료
        </p>
      </div>
    )
  }

  function handleSelect(key) {
    const svc = SERVICE_LIST.find((s) => s.key === key)
    setSelected(key)
    setSubmitted(true)
    onSubmit?.('service', { key, name: svc?.name })
  }

  return (
    <div className="card" style={{ maxWidth: 400 }}>
      <p className="card__title">🛎️ 서비스 선택</p>
      <div className="service-select-card__grid">
        {services.map((svc) => (
          <button
            key={svc.key}
            className="service-select-card__item"
            onClick={() => handleSelect(svc.key)}
          >
            <span className="service-select-card__emoji">{svc.emoji}</span>
            <span className="service-select-card__name">{svc.name}</span>
            <span className="service-select-card__desc">{svc.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
