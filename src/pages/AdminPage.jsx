import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAdminConsultationList,
  fetchConsultationMessages,
  sendConsultationMessage,
  updateConsultationStatus,
} from '../lib/api.js'
import { getServiceName } from '../lib/services.js'

function fmt(n) { return Number(n).toLocaleString('ko-KR') + '원' }

function timeStr(iso) {
  return new Date(iso).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL = { waiting: '대기', active: '상담 중', closed: '종료' }

export default function AdminPage({ user }) {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [roomDetail, setRoomDetail] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('waiting')
  const [forbidden, setForbidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadRooms()
    pollRef.current = setInterval(loadRooms, 3000)
    return () => clearInterval(pollRef.current)
  }, [user, filter])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadRooms() {
    try {
      const { rooms } = await fetchAdminConsultationList(filter)
      setRooms(rooms)
      if (loading) setLoading(false)
    } catch (e) {
      if (e.message?.includes('관리자')) setForbidden(true)
      setLoading(false)
    }
  }

  async function loadMessages(roomId) {
    try {
      const { room, messages } = await fetchConsultationMessages(roomId)
      setRoomDetail(room)
      setMessages(messages)
    } catch {}
  }

  // 3초 폴링으로 현재 방 메시지 갱신
  useEffect(() => {
    if (!selectedId) return
    const t = setInterval(() => loadMessages(selectedId), 3000)
    return () => clearInterval(t)
  }, [selectedId])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await sendConsultationMessage({ roomId: selectedId, content: trimmed })
      await loadMessages(selectedId)
    } catch (e) {
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  async function handleStatus(status) {
    try {
      await updateConsultationStatus({ roomId: selectedId, status })
      setRoomDetail(prev => ({ ...prev, status }))
      loadRooms()
    } catch {}
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (forbidden) return (
    <div className="admin-forbidden">
      <p>관리자 계정이 아니에요.</p>
      <button onClick={() => navigate('/')}>돌아가기</button>
    </div>
  )

  if (loading) return <div className="admin-loading">로딩 중...</div>

  const snap = roomDetail?.estimate_snapshot

  return (
    <div className="admin-page">
      {/* 왼쪽: 방 목록 */}
      <div className="admin-sidebar">
        <div className="admin-sidebar__header">
          <p className="admin-sidebar__title">상담 목록</p>
          <div className="admin-sidebar__filters">
            {['waiting', 'active', 'closed'].map(s => (
              <button
                key={s}
                className={`admin-filter-btn${filter === s ? ' admin-filter-btn--on' : ''}`}
                onClick={() => setFilter(s)}
                type="button"
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-sidebar__list">
          {rooms.length === 0 && <p className="admin-sidebar__empty">없음</p>}
          {rooms.map(r => (
            <button
              key={r.id}
              className={`admin-room-item${selectedId === r.id ? ' admin-room-item--on' : ''}`}
              onClick={() => setSelectedId(r.id)}
              type="button"
            >
              <div className="admin-room-item__top">
                <span className="admin-room-item__email">{r.user?.email || '알 수 없음'}</span>
                <span className="admin-room-item__time">{timeStr(r.created_at)}</span>
              </div>
              {r.last_message && (
                <p className="admin-room-item__preview">{r.last_message.content}</p>
              )}
              {!r.last_message && (
                <p className="admin-room-item__preview admin-room-item__preview--muted">메시지 없음</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 오른쪽: 채팅 */}
      <div className="admin-chat">
        {!selectedId ? (
          <div className="admin-chat__empty">방을 선택하세요</div>
        ) : (
          <>
            {/* 채팅 헤더 */}
            <div className="admin-chat__header">
              <div>
                <p className="admin-chat__email">{roomDetail?.user?.email || ''}</p>
                {snap && (
                  <p className="admin-chat__service">
                    {getServiceName(snap.service_type)}
                    {snap.total_price > 0 ? ` · ${fmt(snap.total_price)}` : ''}
                  </p>
                )}
              </div>
              <div className="admin-chat__actions">
                {roomDetail?.status !== 'active' && roomDetail?.status !== 'closed' && (
                  <button className="admin-action-btn admin-action-btn--start" onClick={() => handleStatus('active')} type="button">상담 시작</button>
                )}
                {roomDetail?.status !== 'closed' && (
                  <button className="admin-action-btn admin-action-btn--close" onClick={() => handleStatus('closed')} type="button">종료</button>
                )}
              </div>
            </div>

            {/* 견적 스냅샷 */}
            {snap?.summary?.length > 0 && (
              <div className="admin-chat__snap">
                {snap.summary.map((line, i) => <span key={i} className="admin-chat__snap-line">{line}</span>)}
              </div>
            )}

            {/* 메시지 */}
            <div className="admin-chat__messages">
              {messages.map(msg => (
                <div key={msg.id} className={`consult-msg consult-msg--${msg.sender}`}>
                  <div className="consult-msg__bubble">{msg.content}</div>
                  <span className="consult-msg__time">
                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* 입력창 */}
            {roomDetail?.status !== 'closed' && (
              <div className="consult-input-wrap">
                <textarea
                  className="consult-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="상담원으로 메시지 입력"
                  rows={1}
                  disabled={sending}
                />
                <button className="consult-send-btn" onClick={handleSend} disabled={!text.trim() || sending} type="button">
                  전송
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
