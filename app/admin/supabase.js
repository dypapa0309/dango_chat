window.dd = { supabase: null, apiBase: '/.netlify/functions' };
(async function(){
  try {
    const res = await fetch('/.netlify/functions/config');
    const data = await res.json();
    if (data.success && data.supabaseUrl && data.supabaseAnonKey) {
      window.dd.supabase = window.supabase.createClient(data.supabaseUrl, data.supabaseAnonKey);
    }
  } catch (e) {
    console.warn('config 로드 실패', e);
  }
})();
