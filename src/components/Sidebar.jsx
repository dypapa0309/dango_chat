import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSupabase } from '../lib/supabase.js'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate()
  return now.getFullYear() === y ? `${m}/${day}` : `${y}/${m}/${day}`
}

export default function Sidebar({ user, open, onClose, onLogin, onNewChat, refreshKey }) {
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user, refreshKey])

  async function loadConversations() {
    const sb = getSupabase()
    const { data } = await sb
      .from('conversations')
      .select('id, title, service_type, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (data) setConversations(data)
  }

  function handleNew() {
    if (onNewChat) onNewChat()   // ChatPage에서 직접 초기화
    navigate('/')
    if (onClose) onClose()
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    const sb = getSupabase()
    await sb.from('conversations').delete().eq('id', id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) navigate('/')
  }

  async function handleSignOut() {
    const sb = getSupabase()
    await sb.auth.signOut()
  }

  // Guest sidebar
  if (!user) {
    return (
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar__header">
          <img className="sidebar__logo" src="/assets/img/favicon.svg" alt="당고" />
          <span style={{ color: 'var(--sb-text)', fontWeight: 700, fontSize: 16, letterSpacing: '.04em' }}>
            당고
          </span>
          <button className="sidebar__toggle" onClick={onClose} aria-label="사이드바 닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <div className="sidebar__list" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--sb-muted)', textAlign: 'center', padding: '0 20px', lineHeight: 1.6 }}>
            로그인하면 대화 기록을<br />저장하고 이어볼 수 있어요.
          </p>
        </div>
        <div className="sidebar__footer">
          <button className="sidebar__new-btn" style={{ margin: '0 12px 12px' }} onClick={onLogin}>
            로그인 / 회원가입
          </button>
        </div>
      </aside>
    )
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'
  const initial = displayName[0]?.toUpperCase() || 'U'

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      {/* Header */}
      <div className="sidebar__header">
        <img className="sidebar__logo" src="/assets/img/favicon.svg" alt="당고" />
        <span style={{ color: 'var(--sb-text)', fontWeight: 700, fontSize: 16, letterSpacing: '.04em' }}>
          당고
        </span>
        <button className="sidebar__toggle" onClick={onClose} aria-label="사이드바 닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* New Chat */}
      <button className="sidebar__new-btn" onClick={handleNew}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        새 대화
      </button>

      {/* Conversation List */}
      <div className="sidebar__list">
        {conversations.length === 0 ? (
          <p style={{ padding: '16px', fontSize: 13, color: 'var(--sb-muted)', textAlign: 'center' }}>
            아직 대화가 없어요
          </p>
        ) : (
          <>
            <div className="sidebar__section-label">최근 대화</div>
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`sidebar__item${activeId === c.id ? ' active' : ''}`}
                onClick={() => { navigate(`/chat/${c.id}`); if (onClose) onClose() }}
              >
                <svg className="sidebar__item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="sidebar__item-label">{c.title}</span>
                <span className="sidebar__item-date">{formatDate(c.updated_at)}</span>
                <button
                  className="sidebar__item-del"
                  onClick={(e) => handleDelete(e, c.id)}
                  aria-label="대화 삭제"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initial}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{displayName}</div>
            <div className="sidebar__user-email">{user?.email}</div>
          </div>
          <button className="sidebar__signout" onClick={handleSignOut} aria-label="로그아웃">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
