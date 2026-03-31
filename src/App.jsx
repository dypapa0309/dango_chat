import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { initSupabase, getSupabase } from './lib/supabase.js'
import LoginPage from './pages/LoginPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ConsultationPage from './pages/ConsultationPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        // 캐시가 있으면 즉시 세션 복구 (config fetch 기다리지 않음)
        const cached = JSON.parse(localStorage.getItem('dango_cfg') || 'null')
        let cfg = (cached?.supabaseUrl && cached?.supabaseAnonKey) ? cached : null

        if (!cfg) {
          // 캐시 없음 → config 직접 fetch
          const res = await fetch('https://dang-o.com/.netlify/functions/config')
          const json = await res.json()
          if (!json.supabaseUrl) throw new Error('Supabase config unavailable')
          cfg = json
          localStorage.setItem('dango_cfg', JSON.stringify({ supabaseUrl: cfg.supabaseUrl, supabaseAnonKey: cfg.supabaseAnonKey }))
        } else {
          // 캐시 있음 → 백그라운드에서 갱신
          fetch('https://dang-o.com/.netlify/functions/config')
            .then(r => r.json())
            .then(json => {
              if (json.supabaseUrl) localStorage.setItem('dango_cfg', JSON.stringify({ supabaseUrl: json.supabaseUrl, supabaseAnonKey: json.supabaseAnonKey }))
            })
            .catch(() => {})
        }

        initSupabase(cfg.supabaseUrl, cfg.supabaseAnonKey)
        const sb = getSupabase()
        const { data } = await sb.auth.getSession()
        setUser(data.session?.user ?? null)
        sb.auth.onAuthStateChange((_event, session) => {
          if (session?.user) localStorage.removeItem('dango_guest_count')
          setUser(session?.user ?? null)
        })
      } catch (e) {
        console.error('[bootstrap]', e)
      } finally {
        setReady(true)
      }
    }
    bootstrap()
  }, [])

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/chat/:id" element={<ChatPage user={user} />} />
      <Route path="/consultation/:roomId" element={<ConsultationPage user={user} />} />
      <Route path="/admin" element={<AdminPage user={user} />} />
      <Route path="/" element={<ChatPage user={user} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
