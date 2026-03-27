import { useState } from 'react'

export default function MultiSelectCard({ data = {}, onSubmit }) {
  const [selected, setSelected] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const options = data.options || []

  function toggle(opt) {
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    )
  }

  function handleConfirm() {
    if (selected.length === 0) return
    setSubmitted(true)
    onSubmit?.('multi_select', { field: data.field, value: selected.join(', ') })
  }

  if (submitted) {
    return (
      <div className="choices-card choices-card--done">
        <span className="choices-card__selected">✅ {selected.join(', ')}</span>
      </div>
    )
  }

  return (
    <div className="multi-select-card">
      <div className="multi-select-card__options">
        {options.map((opt, i) => (
          <button
            key={i}
            className={`multi-select-card__btn${selected.includes(opt) ? ' multi-select-card__btn--on' : ''}`}
            onClick={() => toggle(opt)}
            type="button"
          >
            {selected.includes(opt) ? '✓ ' : ''}{opt}
          </button>
        ))}
      </div>
      <button
        className="card-btn"
        onClick={handleConfirm}
        disabled={selected.length === 0}
        style={{ marginTop: 10 }}
        type="button"
      >
        확인 ({selected.length}개 선택)
      </button>
    </div>
  )
}
