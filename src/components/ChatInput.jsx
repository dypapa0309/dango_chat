import { useRef, useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function handleChange(e) {
    setText(e.target.value)
    autoResize()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed && attachments.length === 0) return
    if (disabled) return
    onSend({ text: trimmed, attachments })
    setText('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    setAttachments((prev) => [...prev, ...files])
    e.target.value = ''
  }

  function removeAttachment(idx) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled

  return (
    <div className="chat-input-wrap">
      <div className="chat-input-inner">
        {attachments.length > 0 && (
          <div className="chat-input-attachments">
            {attachments.map((f, i) => (
              <div key={i} className="chat-input-attachment-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{f.name}</span>
                <button onClick={() => removeAttachment(i)} aria-label="첨부 삭제">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-input-box">
          {/* Attach button */}
          <button
            className="chat-input-attach"
            onClick={() => fileInputRef.current?.click()}
            aria-label="파일 첨부"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            placeholder="무엇이 필요하세요?"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled}
          />

          {/* Send button */}
          <button
            className="chat-input-send"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="전송"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>

        <p className="chat-input-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>
      </div>
    </div>
  )
}
