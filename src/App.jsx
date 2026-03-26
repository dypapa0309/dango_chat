import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { initSupabase, getSupabase } from './lib/supabase.js'
import LoginPage from './pages/LoginPage.jsx'
import ChatPage from './pages/ChatPage.jsx'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetch('/.netlify/functions/config')
        const cfg = await res.json()
        initSupabase(cfg.supabaseUrl, cfg.supabaseAnonKey)
        const sb = getSupabase()
        const { data } = await sb.auth.getSession()
        setUser(data.session?.user ?? null)
        sb.auth.onAuthStateChange((_event, session) => {
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
      <Route
        path="/chat/:id"
        element={user ? <ChatPage user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={user ? <ChatPage user={user} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
