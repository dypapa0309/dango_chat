import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../../src/lib/supabase.js'
import {
  fetchAdminConsultationList,
  fetchConsultationMessages,
  sendConsultationMessage,
  updateConsultationStatus,
} from '../../src/lib/api.js'
import { getServiceName } from '../../src/lib/services.js'

const ADMIN_EMAILS = ['dypapa0309@gmail.com']
function fmt(n) { return Number(n).toLocaleString('ko-KR') + '원' }

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// Room list view
function RoomList({ user, onSelectRoom }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('waiting')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [filter])

  async function load() {
    try {
      const data = await fetchAdminConsultationList(filter)
      setRooms(data || [])
    } catch {}
    setLoading(false)
  }

  return (
    <div className="app-shell admin-page">
      <div className="app-topbar">
        <button className="app-topbar__btn" onClick={() => navigate('/')} aria-label="홈">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
        <span className="app-topbar__title">상담 관리</span>
        <div style={{ width: 40 }} />
      </div>

      <div className="admin-filters">
        {['waiting', 'active', 'closed'].map((s) => (
          <button
            key={s}
            className={`admin-filter-btn${filter === s ? ' admin-filter-btn--on' : ''}`}
            onClick={() => setFilter(s)}
          >
            {{ waiting: '대기', active: '진행', closed: '종료' }[s]}
          </button>
        ))}
      </div>

      <div className="admin-list">
        {loading && <div className="admin-empty">불러오는 중...</div>}
        {!loading && rooms.length === 0 && <div className="admin-empty">상담 내역이 없어요</div>}
        {rooms.map((room) => {
          const last = room.consultation_messages?.[0]
          return (
            <button key={room.id} className="admin-room-item" onClick={() => onSelectRoom(room)}>
              <div className="admin-room-item__top">
                <span className="admin-room-item__email">{room.customer_email || room.user_id}</span>
                <span className="admin-room-item__time">{formatTime(room.updated_at || room.created_at)}</span>
              </div>
              <div className={`admin-room-item__preview${!last ? ' admin-room-item__preview--muted' : ''}`}>
                {last ? last.content : '메시지 없음'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Chat view for selected room
function RoomChat({ room: initialRoom, onBack }) {
  const [room, setRoom] = useState(initialRoom)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    load()
    return () => { channelRef.current?.unsubscribe() }
  }, [room.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function load() {
    try {
      const { room: r, messages: msgs } = await fetchConsultationMessages(room.id)
      setRoom(r)
      setMessages(msgs || [])
      subscribeRealtime()
    } catch {}
  }

  function subscribeRealtime() {
    const sb = getSupabase()
    channelRef.current = sb
      .channel(`admin-consult:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'consultation_messages',
        filter: `room_id=eq.${room.id}`,
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
    if (!trimmed || sending) return
    setSending(true)
    try {
      await sendConsultationMessage({ roomId: room.id, content: trimmed })
      setText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    } catch {}
    setSending(false)
  }

  async function handleStatusChange(newStatus) {
    await updateConsultationStatus({ roomId: room.id, status: newStatus })
    setRoom(prev => ({ ...prev, status: newStatus }))
  }

  const snap = room?.estimate_snapshot

  return (
    <div className="app-shell admin-chat-page">
      <div className="admin-chat__header">
        <button className="app-topbar__btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="admin-chat__info">
          <div className="admin-chat__email">{room.customer_email || room.user_id}</div>
          {snap && <div className="admin-chat__service">{getServiceName(snap.service_type)} · {snap.total_price ? fmt(snap.total_price) : '-'}</div>}
        </div>
        {room.status === 'waiting' && (
          <button className="admin-action-btn admin-action-btn--start" onClick={() => handleStatusChange('active')}>시작</button>
        )}
        {room.status === 'active' && (
          <button className="admin-action-btn admin-action-btn--close" onClick={() => handleStatusChange('closed')}>종료</button>
        )}
      </div>

      {snap && (
        <div className="admin-chat__snap">
          {Object.entries(snap).slice(0, 5).map(([k, v]) => (
            <span key={k} className="admin-chat__snap-line">{k}: {String(v)}</span>
          ))}
        </div>
      )}

      <div className="admin-chat__messages">
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

      <div className="consult-input-wrap">
        <textarea
          ref={textareaRef}
          className="consult-input"
          placeholder={room.status === 'closed' ? '종료된 상담이에요.' : '메시지 입력...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          disabled={sending || room.status === 'closed'}
        />
        <button
          className="consult-send-btn"
          onClick={handleSend}
          disabled={!text.trim() || sending || room.status === 'closed'}
        >
          전송
        </button>
      </div>
    </div>
  )
}

export default function AdminPage({ user }) {
  const [selectedRoom, setSelectedRoom] = useState(null)

  if (!user) return <div className="admin-forbidden">로그인이 필요해요</div>
  if (!ADMIN_EMAILS.includes(user.email)) return <div className="admin-forbidden">접근 권한이 없어요</div>

  if (selectedRoom) {
    return <RoomChat room={selectedRoom} onBack={() => setSelectedRoom(null)} />
  }

  return <RoomList user={user} onSelectRoom={setSelectedRoom} />
}
