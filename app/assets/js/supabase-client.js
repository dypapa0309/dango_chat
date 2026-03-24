/**
 * 고객/드라이버 페이지용 Supabase 클라이언트 초기화
 * window.dd.supabase 로 접근
 * Supabase CDN이 없는 페이지에서도 동적으로 로드
 */
(function () {
  if (!window.dd) window.dd = {};
  window.dd.supabase = null;
  window.dd._sbReady = [];
  window.dd.onSupabaseReady = function (cb) {
    if (window.dd.supabase) { cb(window.dd.supabase); return; }
    window.dd._sbReady.push(cb);
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init() {
    try {
      if (!window.supabase) {
        await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      }
      const res = await fetch('/.netlify/functions/config');
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey && window.supabase) {
        window.dd.supabase = window.supabase.createClient(data.supabaseUrl, data.supabaseAnonKey);
        window.dd._sbReady.forEach((cb) => cb(window.dd.supabase));
        window.dd._sbReady = [];
      }
    } catch (e) {
      console.warn('[supabase-client] 초기화 실패', e);
    }
  }

  init();
})();
