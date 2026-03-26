import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSupabase } from '../lib/supabase.js'
import { SERVICE_LIST } from '../lib/services.js'

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

function SidebarLinks() {
  return (
    <div className="sidebar__links">
      <a className="sidebar__link" href="/customer/lookup.html">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
        </svg>
        내 주문
      </a>
      <a className="sidebar__link" href="/driver/apply.html" target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" />
        </svg>
        전문가 가입하기
      </a>
    </div>
  )
}

function ServiceToggle({ onServiceClick }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sidebar__service-toggle">
      <button
        className="sidebar__service-toggle-btn"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        서비스
        <svg
          className={`sidebar__service-toggle-arrow${open ? ' open' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="sidebar__service-list">
          {SERVICE_LIST.map((svc) => (
            <button
              key={svc.key}
              className="sidebar__service-item"
              onClick={() => onServiceClick(svc)}
            >
              <span>{svc.emoji}</span>
              <span>{svc.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ user, open, onClose, onLogin, onNewChat, refreshKey, onServiceSelect }) {
  const navigate = useNavigate()
  const { id: activeId } = useParams()
  const [conversations, setConversations] = useState([])

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user, refreshKey])

  // 모바일에서 대화 선택 시 사이드바 자동 닫기
  useEffect(() => {
    if (window.innerWidth <= 768) {
      onClose?.()
    }
  }, [activeId])

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
    if (onNewChat) onNewChat()
    navigate('/')
    if (onClose) onClose()
  }

  function handleServiceClick(svc) {
    if (onNewChat) onNewChat()
    navigate('/')
    if (onClose) onClose()
    // 약간의 딜레이 후 서비스 시작 메시지 전송
    setTimeout(() => onServiceSelect?.(svc), 100)
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
      <aside className={`sidebar${open ? ' open' : ' collapsed'}`}>
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

        <ServiceToggle onServiceClick={handleServiceClick} />

        <div className="sidebar__list" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--sb-muted)', textAlign: 'center', padding: '0 20px', lineHeight: 1.6 }}>
            로그인하면 대화 기록을<br />저장하고 이어볼 수 있어요.
          </p>
        </div>
        <div className="sidebar__footer">
          <SidebarLinks />
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
    <aside className={`sidebar${open ? ' open' : ' collapsed'}`}>
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

      {/* Service Toggle */}
      <ServiceToggle onServiceClick={handleServiceClick} />

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
        <SidebarLinks />
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
