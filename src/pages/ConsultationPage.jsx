import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase.js'
import { fetchConsultationMessages, sendConsultationMessage } from '../lib/api.js'
import { getServiceName } from '../lib/services.js'

function fmt(n) {
  return Number(n).toLocaleString('ko-KR') + '원'
}

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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultation_rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        setRoom(prev => ({ ...prev, status: payload.new.status }))
      })
      .subscribe()
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await sendConsultationMessage({ roomId, content: trimmed })
    } catch (e) {
      setError(e.message)
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const snap = room?.estimate_snapshot
  const isClosed = room?.status === 'closed'

  if (loading) return <div className="consult-loading">불러오는 중...</div>
  if (error) return <div className="consult-error">{error}</div>

  return (
    <div className="consult-page">
      {/* 헤더 */}
      <div className="consult-header">
        <button className="consult-header__back" onClick={() => navigate('/')} type="button">← 돌아가기</button>
        <div className="consult-header__info">
          <span className="consult-header__title">상담원과 채팅</span>
          <span className={`consult-header__badge consult-header__badge--${room?.status}`}>
            {room?.status === 'waiting' ? '대기 중' : room?.status === 'active' ? '상담 중' : '종료'}
          </span>
        </div>
      </div>

      {/* 견적 요약 */}
      {snap && (
        <div className="consult-estimate">
          <p className="consult-estimate__label">요청한 견적</p>
          <p className="consult-estimate__service">{getServiceName(snap.service_type)}</p>
          {snap.total_price > 0 && (
            <p className="consult-estimate__price">총 {fmt(snap.total_price)}</p>
          )}
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="consult-messages">
        {room?.status === 'waiting' && messages.length === 0 && (
          <div className="consult-status-msg">
            상담 요청이 접수됐어요. 상담원이 곧 연결됩니다 😊
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`consult-msg consult-msg--${msg.sender}`}>
            <div className="consult-msg__bubble">{msg.content}</div>
            <span className="consult-msg__time">
              {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isClosed && (
          <div className="consult-status-msg consult-status-msg--closed">상담이 종료됐어요.</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      {!isClosed && (
        <div className="consult-input-wrap">
          <textarea
            className="consult-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요"
            rows={1}
            disabled={sending}
          />
          <button className="consult-send-btn" onClick={handleSend} disabled={!text.trim() || sending} type="button">
            전송
          </button>
        </div>
      )}
    </div>
  )
}
