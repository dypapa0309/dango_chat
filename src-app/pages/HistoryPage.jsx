import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabase } from '../../src/lib/supabase.js'

function formatDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / 86400000)
  if (days === 0) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return `${days}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function HistoryPage({ user }) {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    load()
  }, [user])

  async function load() {
    const sb = getSupabase()
    const { data } = await sb
      .from('conversations')
      .select('id, title, updated_at, state')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)
    setConversations(data || [])
    setLoading(false)
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    const sb = getSupabase()
    await sb.from('conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="app-shell history-page">
      {/* TopBar */}
      <div className="app-topbar">
        <button className="app-topbar__btn" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="app-topbar__title">대화 기록</span>
        <button
          className="app-topbar__btn"
          onClick={() => navigate('/')}
          aria-label="새 대화"
          style={{ color: 'var(--brand)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* List */}
      <div className="history-list">
        {loading && (
          <div className="history-empty">불러오는 중...</div>
        )}

        {!loading && !user && (
          <div className="history-empty">
            <p>로그인하면 대화 기록을 볼 수 있어요</p>
            <button
              style={{ marginTop: 12, padding: '10px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          </div>
        )}

        {!loading && user && conversations.length === 0 && (
          <div className="history-empty">
            <p>아직 대화 기록이 없어요</p>
            <button
              style={{ marginTop: 12, padding: '10px 24px', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', font: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              새 대화 시작
            </button>
          </div>
        )}

        {conversations.map((conv) => (
          <button key={conv.id} className="history-item" onClick={() => navigate(`/chat/${conv.id}`)}>
            <div className="history-item__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="history-item__body">
              <div className="history-item__title">{conv.title || '대화'}</div>
              <div className="history-item__date">{formatDate(conv.updated_at)}</div>
            </div>
            <svg className="history-item__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Sign out if logged in */}
      {user && (
        <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>{user.email}</div>
          <button
            style={{ background: 'none', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-md)', padding: '10px 16px', font: 'inherit', fontSize: 14, color: 'var(--muted)', cursor: 'pointer', width: '100%' }}
            onClick={async () => {
              await getSupabase().auth.signOut()
              navigate('/')
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
