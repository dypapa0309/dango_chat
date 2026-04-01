import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Browser } from '@capacitor/browser'
import { getSupabase } from '../../src/lib/supabase.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [role, setRole] = useState('customer')

  async function oauthLogin(provider, label) {
    setStatus(`${label} 로그인 창을 여는 중...`)
    try {
      const sb = getSupabase()
      const { data, error } = await sb.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `dangomove://auth/callback`,
          skipBrowserRedirect: true,
        },
      })
      if (error) { setStatus('로그인 중 오류가 발생했어요. 다시 시도해주세요.'); return }
      if (data?.url) {
        await Browser.open({ url: data.url, presentationStyle: 'popover' })
      }
    } catch {
      setStatus('로그인 중 오류가 발생했어요. 다시 시도해주세요.')
    }
  }

  async function demoLogin() {
    setStatus('테스트 계정으로 로그인 중...')
    try {
      const sb = getSupabase()
      const email = role === 'driver' ? 'demo-driver@dang-o.com' : 'demo-customer@dang-o.com'
      const password = role === 'driver' ? 'DemoDriver2026!' : 'DemoCustomer2026!'
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) { setStatus('테스트 계정 로그인 실패. 잠시 후 다시 시도해주세요.'); return }
      navigate(role === 'driver' ? '/driver/index.html' : '/')
    } catch {
      setStatus('로그인 중 오류가 발생했어요.')
    }
  }

  const isDriver = role === 'driver'

  return (
    <div className="login-page">
      <button className="login-back" onClick={() => navigate(-1)} aria-label="뒤로가기">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="login-card">
        <div className="login-brand">
          <img src="/assets/img/favicon.svg" alt="당고" />
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab${!isDriver ? ' active' : ''}`}
            onClick={() => { setRole('customer'); setStatus('') }}
          >
            고객
          </button>
          <button
            className={`login-tab${isDriver ? ' active' : ''}`}
            onClick={() => { setRole('driver'); setStatus('') }}
          >
            전문가
          </button>
        </div>

        {isDriver ? (
          <>
            <h1 className="login-title">전문가로 시작하세요</h1>
            <p className="login-sub">로그인하면 배차 내역, 정산, 프로필을<br />한 곳에서 관리할 수 있어요.</p>
          </>
        ) : (
          <>
            <h1 className="login-title">간편하게 시작하세요</h1>
            <p className="login-sub">로그인하면 전문가 매칭, 주문 내역,<br />재주문을 한 곳에서 편하게 할 수 있어요.</p>
          </>
        )}

        <button className="login-btn login-btn--kakao" onClick={() => oauthLogin('kakao', '카카오')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.608 5.08 4.05 6.524l-1.03 3.816a.3.3 0 0 0 .437.333L9.64 19.12A11.3 11.3 0 0 0 12 19.4c5.523 0 10-3.477 10-7.8S17.523 3 12 3z" />
          </svg>
          카카오로 시작하기
        </button>

        <div className="login-divider">또는</div>

        <button className="login-btn" onClick={() => oauthLogin('google', '구글')}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.3 33.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l6.1-6.1C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" />
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.8 1.1 8 2.9l6.1-6.1C34.3 6.1 29.4 4 24 4 16.2 4 9.5 8.4 6.3 14.7z" />
            <path fill="#FBBC05" d="M24 44c5.4 0 10.3-1.9 14.1-5.1l-6.5-5.3C29.6 35.5 26.9 36.5 24 36.5c-5.7 0-10.4-3.8-11.8-9H4.5C7.6 36.6 15.3 44 24 44z" />
            <path fill="#EA4335" d="M43.6 20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.5l6.5 5.3C41.4 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z" />
          </svg>
          Google로 시작하기
        </button>

        <button className="login-btn login-btn--apple" onClick={() => oauthLogin('apple', 'Apple')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.365 1.43c0 1.14-.41 2.182-1.087 2.94-.736.817-1.938 1.45-3.14 1.35-.15-1.097.393-2.275 1.11-3.014.736-.778 2.015-1.33 3.117-1.276zM20.59 17.126c-.58 1.33-.858 1.923-1.605 3.1-1.043 1.64-2.515 3.687-4.34 3.705-1.62.018-2.04-1.06-4.24-1.048-2.2.012-2.66 1.066-4.28 1.048-1.823-.018-3.217-1.87-4.26-3.51-2.92-4.593-3.226-9.98-1.425-12.75 1.28-1.97 3.31-3.123 5.214-3.123 1.94 0 3.16 1.066 4.76 1.066 1.55 0 2.494-1.067 4.746-1.067 1.697 0 3.494.925 4.77 2.52-4.2 2.304-3.52 8.34.66 10.06z"/>
          </svg>
          Apple로 시작하기
        </button>

        {isDriver && (
          <>
            <div className="login-divider">또는</div>
            <a className="login-btn login-btn--ghost" href="/driver/apply.html">전문가 회원가입 하러 가기</a>
          </>
        )}

        <p className="login-status">{status}</p>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={demoLogin}
            style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}
          >
            테스트 계정으로 시작 ({role === 'driver' ? '전문가' : '고객'})
          </button>
        </div>
      </div>
    </div>
  )
}
