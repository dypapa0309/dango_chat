import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { initSupabase, getSupabase } from '../src/lib/supabase.js'
import ChatPage from './pages/ChatPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ConsultationPage from './pages/ConsultationPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function bootstrap() {
      try {
        const cached = JSON.parse(localStorage.getItem('dango_cfg') || 'null')
        let cfg = (cached?.supabaseUrl && cached?.supabaseAnonKey) ? cached : null

        if (!cfg) {
          const res = await fetch('https://dang-o.com/.netlify/functions/config')
          const json = await res.json()
          if (!json.supabaseUrl) throw new Error('config unavailable')
          cfg = json
          localStorage.setItem('dango_cfg', JSON.stringify({ supabaseUrl: cfg.supabaseUrl, supabaseAnonKey: cfg.supabaseAnonKey }))
        } else {
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

        // Capacitor 딥링크 — dangomove://auth/callback#access_token=...&refresh_token=...
        CapApp.addListener('appUrlOpen', async ({ url }) => {
          if (!url.startsWith('dangomove://auth/callback')) return
          await Browser.close()
          // Supabase는 토큰을 hash(#) 또는 query(?) 로 전달
          const hash = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || ''
          const params = new URLSearchParams(hash)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            await sb.auth.setSession({ access_token, refresh_token })
          }
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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/history" element={<HistoryPage user={user} />} />
        <Route path="/chat/:id" element={<ChatPage user={user} />} />
        <Route path="/consultation/:roomId" element={<ConsultationPage user={user} />} />
        <Route path="/admin" element={<AdminPage user={user} />} />
        <Route path="/" element={<ChatPage user={user} />} />
      </Routes>
    </BrowserRouter>
  )
}
