import { useState } from 'react'

export default function DatePickerCard({ data = {}, onSubmit }) {
  const [date, setDate] = useState(data.defaultDate || '')
  const [time, setTime] = useState(data.defaultTime || '')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="card">
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          ✅ {date} {time && `${time} `}선택 완료
        </p>
      </div>
    )
  }

  function handleConfirm() {
    if (!date) return
    setSubmitted(true)
    onSubmit?.('date', { date, time })
  }

  // Min date: today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="card">
      <p className="card__title">📅 날짜 선택</p>
      <div className="date-card__inputs">
        <input
          type="date"
          className="date-card__input"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          className="date-card__input"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="시간 (선택)"
        />
      </div>
      <button
        className="card-btn"
        onClick={handleConfirm}
        disabled={!date}
      >
        확인
      </button>
    </div>
  )
}
