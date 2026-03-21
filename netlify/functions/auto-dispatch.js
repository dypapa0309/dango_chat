import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const siteUrl = env('SITE_URL', 'http://localhost:8888').replace(/\/$/, '');
    const supabase = adminClient();
    const { data: jobs, error } = await supabase.from('jobs').select('*').eq('dispatch_status', 'reassign_needed').order('created_at', { ascending: true });
    if (error) throw error;
    const results = [];
    for (const job of jobs || []) {
      try {
        const res = await fetch(`${siteUrl}/.netlify/functions/assign-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id })
        });
        results.push(await res.json());
      } catch (e) {
        results.push({ success: false, error: e.message, jobId: job.id });
      }
    }
    return ok({ count: jobs?.length || 0, results });
  } catch (error) {
    return fail('자동 재배차 실패', error.message, 500);
  }
}
