import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSupabase } from '../../src/lib/supabase.js'
import { fetchConsultationMessages, sendConsultationMessage } from '../../src/lib/api.js'
import { getServiceName } from '../../src/lib/services.js'

function fmt(n) { return Number(n).toLocaleString('ko-KR') + '원' }

export default function ConsultationPage({ user }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
    return () => { channelRef.current?.unsubscribe() }
  }, [roomId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function load() {
    setLoading(true)
    try {
      const { room, messages } = await fetchConsultationMessages(roomId)
      setRoom(room)
      setMessages(messages)
      subscribeRealtime()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function subscribeRealtime() {
    const sb = getSupabase()
    channelRef.current = sb
      .channel(`consultation:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'consultation_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending || room?.status === 'closed') return
    setSending(true)
    try {
      await sendConsultationMessage({ roomId, content: trimmed })
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const snap = room?.estimate_snapshot
  const statusLabel = { waiting: '대기 중', active: '상담 중', closed: '종료' }
  const statusClass = { waiting: 'waiting', active: 'active', closed: 'closed' }

  if (loading) return <div className="consult-loading">불러오는 중...</div>
  if (error) return <div className="consult-error">{error}</div>

  return (
    <div className="consult-page">
      {/* Header */}
      <div className="consult-header">
        <button className="consult-header__back" onClick={() => navigate(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="consult-header__info">
          <span className="consult-header__title">전문가 상담</span>
          {room && (
            <span className={`consult-header__badge consult-header__badge--${statusClass[room.status]}`}>
              {statusLabel[room.status] || room.status}
            </span>
          )}
        </div>
      </div>

      {/* Estimate info */}
      {snap && (
        <div className="consult-estimate">
          <div className="consult-estimate__label">견적 요청</div>
          <div className="consult-estimate__service">{getServiceName(snap.service_type) || snap.service_type}</div>
          {snap.total_price && <div className="consult-estimate__price">{fmt(snap.total_price)}</div>}
        </div>
      )}

      {/* Messages */}
      <div className="consult-messages">
        {room?.status === 'waiting' && (
          <div className="consult-status-msg">전문가 연결을 기다리는 중이에요.</div>
        )}
        {room?.status === 'closed' && (
          <div className="consult-status-msg consult-status-msg--closed">상담이 종료되었어요.</div>
        )}

        {messages.map((msg) => {
          const isCustomer = msg.sender_role === 'customer'
          const time = new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={msg.id} className={`consult-msg consult-msg--${isCustomer ? 'customer' : 'agent'}`}>
              <div className="consult-msg__bubble">{msg.content}</div>
              <div className="consult-msg__time">{time}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="consult-input-wrap">
        <textarea
          ref={textareaRef}
          className="consult-input"
          placeholder={room?.status === 'closed' ? '상담이 종료되었어요.' : '메시지를 입력하세요...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          disabled={sending || room?.status === 'closed'}
        />
        <button
          className="consult-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending || room?.status === 'closed'}
        >
          전송
        </button>
      </div>
    </div>
  )
}
