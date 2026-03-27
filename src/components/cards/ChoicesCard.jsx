import { useState } from 'react'

export default function ChoicesCard({ data = {}, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const options = data.options || []

  if (selected !== null) {
    return (
      <div className="choices-card choices-card--done">
        <span className="choices-card__selected">✅ {selected}</span>
      </div>
    )
  }

  return (
    <div className="choices-card">
      {options.map((opt, i) => (
        <button
          key={i}
          className="choices-card__btn"
          onClick={() => {
            setSelected(opt)
            onSubmit?.('choice', { text: opt, field: data.field })
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
