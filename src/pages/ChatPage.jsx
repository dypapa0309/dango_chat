import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSupabase } from '../lib/supabase.js'
import { sendChatMessage } from '../lib/api.js'
import { SERVICE_LIST } from '../lib/services.js'
import Sidebar from '../components/Sidebar.jsx'
import MessageBubble, { TypingIndicator } from '../components/MessageBubble.jsx'
import ChatInput from '../components/ChatInput.jsx'

const WELCOME_CHIPS = [
  '소형이사 견적 받고 싶어요',
  '에어컨 청소 예약하고 싶어요',
  '폐기물 수거 해주세요',
  '골프 레슨 받고 싶어요',
]

const GUEST_LIMIT = 3

export default function ChatPage({ user }) {
  const { id: conversationId } = useParams()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
  const [messages, setMessages] = useState([])
  const [conversationState, setConversationState] = useState({ phase: 'greeting', collected: {} })
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('새 대화')
  const [initialized, setInitialized] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)
  const bottomRef = useRef(null)

  function handleNewChat() {
    setMessages([])
    setConversationState({ phase: 'greeting', collected: {} })
    setTitle('새 대화')
    setInitialized(true)
    setResetKey((k) => k + 1)
  }

  // Load conversation + messages when conversationId changes
  useEffect(() => {
    setInitialized(false)
    if (conversationId) {
      if (!user) { navigate('/'); return }
      loadConversation(conversationId)
    } else {
      setMessages([])
      setConversationState({ phase: 'greeting', collected: {} })
      setTitle('새 대화')
      setInitialized(true)
    }
  }, [conversationId, user])

  // Scroll to bottom on new messages or load
  useEffect(() => {
    if (initialized) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length > 1 ? 'smooth' : 'instant' })
    }
  }, [messages, loading, initialized])

  async function loadConversation(id) {
    const sb = getSupabase()
    const [{ data: conv }, { data: msgs }] = await Promise.all([
      sb.from('conversations').select('*').eq('id', id).single(),
      sb.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
    ])
    if (!conv) { navigate('/'); return }
    setTitle(conv.title || '대화')
    setConversationState(conv.state || { phase: 'greeting', collected: {} })
    setMessages(msgs || [])
    setInitialized(true)
  }

  async function ensureConversation(firstMessage) {
    if (conversationId) return conversationId

    const sb = getSupabase()
    const title = firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '')
    const { data, error } = await sb
      .from('conversations')
      .insert({ user_id: user.id, title, state: { phase: 'greeting', collected: {} } })
      .select()
      .single()

    if (error) throw new Error('대화 생성 실패')
    navigate(`/chat/${data.id}`, { replace: true })
    setSidebarRefreshKey((k) => k + 1)  // 사이드바 목록 갱신
    return data.id
  }

  async function saveMessage(convId, role, content, card = null) {
    const sb = getSupabase()
    const { data } = await sb
      .from('messages')
      .insert({ conversation_id: convId, role, content, card })
      .select()
      .single()
    return data
  }

  async function updateConversationState(convId, newState, newTitle) {
    const sb = getSupabase()
    const update = { state: newState, updated_at: new Date().toISOString() }
    if (newTitle) update.title = newTitle
    await sb.from('conversations').update(update).eq('id', convId)
  }

  const handleSend = useCallback(async ({ text }) => {
    if (!text.trim() || loading) return

    // Guest limit check
    if (!user) {
      const count = parseInt(localStorage.getItem('dango_guest_count') || '0', 10)
      if (count >= GUEST_LIMIT) {
        setShowLoginModal(true)
        return
      }
      localStorage.setItem('dango_guest_count', String(count + 1))
    }

    setLoading(true)
    const userContent = text.trim()

    const tempUserMsg = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      let convId = null
      let savedUser = tempUserMsg

      if (user) {
        convId = await ensureConversation(userContent)
        savedUser = await saveMessage(convId, 'user', userContent)
        setMessages((prev) => prev.map((m) => (m.id === tempUserMsg.id ? savedUser : m)))
      }

      const allMsgs = [...messages.filter((m) => m.id !== tempUserMsg.id), savedUser]
      const aiMessages = allMsgs.slice(-20).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      const result = await sendChatMessage({
        messages: aiMessages,
        state: conversationState,
        conversationId: convId,
      })

      const newState = result.state || conversationState
      setConversationState(newState)

      if (user) {
        const savedAI = await saveMessage(convId, 'assistant', result.message, result.card || null)
        setMessages((prev) => [...prev, savedAI])
        const newTitle = messages.length === 0 ? userContent.slice(0, 30) : null
        await updateConversationState(convId, newState, newTitle)
        if (newTitle) {
          setTitle(newTitle)
          setSidebarRefreshKey((k) => k + 1)
        }
      } else {
        setMessages((prev) => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: result.message,
          card: result.card || null,
          created_at: new Date().toISOString(),
        }])
      }
    } catch (err) {
      console.error('[chat]', err)
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '죄송해요, 잠깐 문제가 생겼어요. 다시 시도해주세요.',
        created_at: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, conversationId, conversationState, user])

  // Card submit handler
  async function handleCardSubmit(type, data) {
    let text = ''
    switch (type) {
      case 'date':
        text = `날짜: ${data.date}${data.time ? ` ${data.time}` : ''}`
        break
      case 'address':
        text = `주소: ${data.address}${data.detail ? ` ${data.detail}` : ''}`
        break
      case 'service':
        text = `${data.name} 서비스로 진행할게요`
        break
      case 'estimate_cancel':
        text = '견적을 다시 받고 싶어요'
        break
      case 'payment':
        if (data.jobId) {
          window.location.href = `/customer/pay.html?job_id=${data.jobId}`
        }
        return
      default:
        text = JSON.stringify(data)
    }
    handleSend({ text })
  }

  const isNew = !conversationId
  const guestCount = user ? null : parseInt(localStorage.getItem('dango_guest_count') || '0', 10)
  const guestRemaining = user ? null : GUEST_LIMIT - guestCount

  return (
    <div className="chat-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen && window.innerWidth <= 768 ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogin={() => navigate('/login')}
        onNewChat={handleNewChat}
        refreshKey={sidebarRefreshKey}
        onServiceSelect={(svc) => handleSend({ text: `${svc.name} ${svc.desc}` })}
      />

      {/* Main chat area */}
      <div className="chat-main">
        {/* Top bar */}
        <div className="chat-topbar">
          <button
            className="chat-topbar__toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="사이드바 토글"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="chat-topbar__title">{title}</span>
          {!user && (
            <button className="chat-topbar__login-btn" onClick={() => navigate('/login')}>
              로그인
            </button>
          )}
        </div>

        {/* Guest remaining notice */}
        {!user && guestCount > 0 && guestRemaining > 0 && (
          <div className="guest-notice">
            비회원은 {guestRemaining}번 더 이용 가능 · <button onClick={() => navigate('/login')}>로그인하면 무제한</button>
          </div>
        )}

        {/* Messages */}
        <div className="message-list" key={resetKey}>
          {initialized && isNew && messages.length === 0 ? (
            <WelcomeScreen onChip={(text) => handleSend({ text })} user={user} onLogin={() => navigate('/login')} />
          ) : (
            <div className="message-list__inner">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onCardSubmit={handleCardSubmit}
                  user={user}
                  onLogin={() => setShowLoginModal(true)}
                />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>

      {/* Login modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal__title">로그인이 필요해요</p>
            <p className="modal__desc">
              비회원은 3번까지 무료로 이용할 수 있어요.<br />
              로그인하면 대화 기록 저장 및 무제한 이용이 가능해요.
            </p>
            <button className="modal__btn" onClick={() => navigate('/login')}>
              로그인 / 회원가입
            </button>
            <button className="modal__btn modal__btn--ghost" onClick={() => setShowLoginModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function WelcomeScreen({ onChip, user, onLogin }) {
  return (
    <div className="welcome">
      <img className="welcome__logo" src="/assets/img/favicon.svg" alt="당고" />
      <h1 className="welcome__title">무엇을 도와드릴까요?</h1>
      <p className="welcome__sub">
        이사, 청소, 설치부터 레슨, 상담까지<br />
        자유롭게 말씀해 주세요.
      </p>
      <div className="welcome__chips">
        {WELCOME_CHIPS.map((chip) => (
          <button key={chip} className="welcome__chip" onClick={() => onChip(chip)}>
            {chip}
          </button>
        ))}
      </div>
      {!user && (
        <p className="welcome__guest-note">
          비회원으로 3번 무료 이용 가능 ·{' '}
          <button className="welcome__guest-login" onClick={onLogin}>로그인</button>
        </p>
      )}
    </div>
  )
}
