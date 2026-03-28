import { useState } from 'react'
import { createPortal } from 'react-dom'

const MODAL_THRESHOLD = 7

export default function MultiSelectCard({ data = {}, onSubmit }) {
  const [selected, setSelected] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const options = data.options || []
  const useModal = options.length >= MODAL_THRESHOLD

  function toggle(opt) {
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    )
  }

  function handleConfirm() {
    if (selected.length === 0) return
    setSubmitted(true)
    setModalOpen(false)
    onSubmit?.('multi_select', { field: data.field, value: selected.join(', ') })
  }

  if (submitted) {
    return (
      <div className="choices-card choices-card--done">
        <span className="choices-card__selected">✅ {selected.join(', ')}</span>
      </div>
    )
  }

  // 선택지 적을 때 — 기존 인라인 UI
  if (!useModal) {
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

  // 선택지 많을 때 — 모달 버튼 + 오버레이
  return (
    <>
      <div className="multi-select-card">
        {selected.length > 0 && (
          <p className="multi-select-card__preview">
            선택됨: {selected.join(', ')}
          </p>
        )}
        <button
          className="card-btn"
          onClick={() => setModalOpen(true)}
          type="button"
        >
          {selected.length > 0 ? `${selected.length}개 선택됨 — 수정` : '항목 선택하기'}
        </button>
      </div>

      {modalOpen && createPortal(
        <div className="ms-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal__header">
              <p className="ms-modal__title">{data.title || '항목 선택'}</p>
              <button className="ms-modal__close" onClick={() => setModalOpen(false)} type="button">✕</button>
            </div>
            <div className="ms-modal__body">
              {options.map((opt, i) => (
                <label key={i} className={`ms-modal__item${selected.includes(opt) ? ' ms-modal__item--on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div className="ms-modal__footer">
              <button
                className="card-btn"
                onClick={handleConfirm}
                disabled={selected.length === 0}
                type="button"
              >
                확인 ({selected.length}개 선택)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
