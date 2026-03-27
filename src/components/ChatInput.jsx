import { useRef, useState, useEffect } from 'react'

export default function ChatInput({ onSend, onLocation, disabled }) {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState(null) // { name, base64, previewUrl }
  const [showMenu, setShowMenu] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locStatus, setLocStatus] = useState('') // '' | 'loading' | 'error'
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const menuRef = useRef(null)

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showMenu) return
    function onClickOutside(e) {
      if (!menuRef.current?.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showMenu])

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
    if (!trimmed && !attachment) return
    if (disabled) return
    onSend({ text: trimmed, imageBase64: attachment?.base64 || null })
    setText('')
    setAttachment(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setAttachment({
        name: file.name,
        base64: dataUrl.split(',')[1],
        previewUrl: dataUrl,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleLocation() {
    if (!navigator.geolocation) {
      setLocStatus('error')
      setTimeout(() => setLocStatus(''), 4000)
      return
    }
    setLocLoading(true)
    setLocStatus('loading')
    setShowMenu(false)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const res = await fetch(`/.netlify/functions/reverse-geocode?lat=${lat}&lng=${lng}`)
          const data = await res.json()
          if (data.address) {
            onLocation?.(data.address)
            setLocStatus('')
          } else {
            setLocStatus(res.status === 404 ? 'notfound' : 'error')
            setTimeout(() => setLocStatus(''), 4000)
          }
        } catch {
          setLocStatus('error')
          setTimeout(() => setLocStatus(''), 4000)
        }
        setLocLoading(false)
      },
      (err) => {
        console.warn('[geolocation]', err.code, err.message)
        setLocLoading(false)
        setLocStatus(err.code === 1 ? 'denied' : 'error')
        setTimeout(() => setLocStatus(''), 5000)
      },
      { timeout: 8000, enableHighAccuracy: false }
    )
  }

  const canSend = (text.trim().length > 0 || !!attachment) && !disabled

  return (
    <div className="chat-input-wrap">
      <div className="chat-input-inner">

        {/* 이미지 미리보기 */}
        {attachment && (
          <div className="chat-input-attachments">
            <div className="chat-input-attachment-item">
              <img src={attachment.previewUrl} alt="첨부 이미지" className="chat-input-attachment-thumb" />
              <span>{attachment.name}</span>
              <button onClick={() => setAttachment(null)} aria-label="첨부 삭제">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="chat-input-box">
          {/* + 버튼 + 팝업 메뉴 */}
          <div className="attach-menu-wrap" ref={menuRef}>
            <button
              className="chat-input-attach"
              onClick={() => setShowMenu(v => !v)}
              aria-label="첨부"
              type="button"
              disabled={locLoading}
            >
              {locLoading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              )}
            </button>

            {showMenu && (
              <div className="attach-menu">
                <button
                  className="attach-menu__item"
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); setShowMenu(false) }}
                >
                  📷 사진 업로드
                </button>
                <button
                  className="attach-menu__item"
                  type="button"
                  onClick={handleLocation}
                >
                  📍 현재 위치 공유
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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

          {/* 전송 버튼 */}
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

        {locStatus === 'loading' && (
          <p className="chat-input-hint chat-input-hint--loc">📍 현재 위치를 가져오는 중...</p>
        )}
        {locStatus === 'denied' && (
          <p className="chat-input-hint chat-input-hint--err">위치 권한이 차단되어 있어요. 브라우저 주소창의 자물쇠 아이콘을 눌러 허용해주세요.</p>
        )}
        {locStatus === 'notfound' && (
          <p className="chat-input-hint chat-input-hint--err">현재 위치 주소를 찾지 못했어요. 주소를 직접 입력해주세요.</p>
        )}
        {locStatus === 'error' && (
          <p className="chat-input-hint chat-input-hint--err">위치를 가져오지 못했어요. 잠시 후 다시 시도해주세요.</p>
        )}
        {!locStatus && <p className="chat-input-hint">Enter로 전송 · Shift+Enter로 줄바꿈</p>}
      </div>
    </div>
  )
}
