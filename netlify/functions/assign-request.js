import crypto from 'crypto';
import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { rankDrivers, dispatchMessage } from '../../shared/dispatch.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { jobId, driverId } = parseBody(event);
    if (!jobId) return fail('jobId가 필요합니다.');

    const supabase = adminClient();
    const { data: job, error: jobError } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    if (jobError) throw jobError;

    let selectedDriver = null;
    if (driverId) {
      const { data, error } = await supabase.from('drivers').select('*').eq('id', driverId).single();
      if (error) throw error;
      selectedDriver = data;
    } else {
      const { data: drivers, error } = await supabase.from('drivers').select('*');
      if (error) throw error;
      const ranked = rankDrivers(job, drivers || []);
      selectedDriver = ranked[0];
    }

    if (!selectedDriver) return fail('배차 가능한 기사가 없습니다.');

    const { count } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('job_id', jobId);
    const attempt = Number(count || 0) + 1;
    const maxAttempts = Number(env('DISPATCH_MAX_ATTEMPTS', '3'));
    if (attempt > maxAttempts) return fail('최대 재배차 횟수를 초과했습니다.');

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + Number(env('AUTO_REASSIGN_MINUTES', '10')) * 60000).toISOString();
    const snapshot = {
      job_id: job.id,
      driver_name: selectedDriver.name,
      driver_id: selectedDriver.id,
      score: selectedDriver.dispatch_score || null,
      distance_km: selectedDriver.distance_km || null
    };

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        job_id: jobId,
        driver_id: selectedDriver.id,
        request_order: attempt,
        status: 'requested',
        dispatch_token: token,
        expires_at: expiresAt,
        request_snapshot: snapshot,
        created_by: 'system',
        updated_by: 'system'
      })
      .select('*')
      .single();
    if (assignmentError) throw assignmentError;

    await supabase.from('jobs').update({ dispatch_status: 'requesting', updated_by: 'system' }).eq('id', jobId);
    await supabase.from('dispatch_logs').insert({
      job_id: jobId,
      assignment_id: assignment.id,
      driver_id: selectedDriver.id,
      event_type: 'assignment_requested',
      actor_type: 'system',
      actor_name: 'dispatch-engine',
      prev_status: job.dispatch_status || 'idle',
      next_status: 'requesting',
      message: '배차 요청 생성',
      meta: snapshot
    });

    const siteUrl = env('SITE_URL', 'http://localhost:8888');
    const message = dispatchMessage({ job, driver: selectedDriver, token, siteUrl });
    let smsResult = null;
    try {
      const smsRes = await fetch(`${siteUrl.replace(/\/$/, '')}/.netlify/functions/sendDispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverPhone: selectedDriver.phone, message })
      });
      smsResult = await smsRes.json();
    } catch {}

    return ok({ assignmentId: assignment.id, driver: selectedDriver, smsResult });
  } catch (error) {
    return fail('배차 요청 생성 실패', error.message, 500);
  }
}
