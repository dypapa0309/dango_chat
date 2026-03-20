import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  const supabase = adminClient();

  try {
    if (event.httpMethod === 'GET') {
      const token = event?.queryStringParameters?.token;
      if (!token) return fail('token이 필요합니다.');
      const { data: assignment, error } = await supabase
        .from('assignments')
        .select('*, jobs(*)')
        .eq('dispatch_token', token)
        .single();
      if (error) throw error;
      if (!assignment) return fail('배차 요청을 찾을 수 없습니다.');
      if (assignment.status !== 'requested') {
        return ok({ handled: true, message: '이미 처리된 요청입니다.', job: assignment.jobs, assignment });
      }
      if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
        await supabase.from('assignments').update({ status: 'expired', updated_by: 'system' }).eq('id', assignment.id);
        await supabase.from('jobs').update({ dispatch_status: 'reassign_needed', updated_by: 'system' }).eq('id', assignment.job_id);
        return ok({ expired: true, message: '만료된 요청입니다.', job: assignment.jobs });
      }
      await supabase.from('assignments').update({ viewed_at: new Date().toISOString(), updated_by: 'driver' }).eq('id', assignment.id);
      return ok({ job: assignment.jobs, assignment });
    }

    if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
    const { token, action, responseNote } = parseBody(event);
    if (!token || !action) return fail('token, action이 필요합니다.');

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select('*, jobs(*)')
      .eq('dispatch_token', token)
      .single();
    if (error) throw error;
    if (!assignment || assignment.status !== 'requested') return fail('이미 처리되었거나 없는 요청입니다.');

    if (action === 'accept') {
      await supabase.from('assignments').update({ status: 'accepted', responded_at: new Date().toISOString(), response_note: responseNote || null, updated_by: 'driver' }).eq('id', assignment.id);
      await supabase.from('assignments').update({ status: 'blocked', updated_by: 'system' }).eq('job_id', assignment.job_id).eq('status', 'requested').neq('id', assignment.id);
      await supabase.from('jobs').update({ status: 'assigned', dispatch_status: 'accepted', assigned_driver_id: assignment.driver_id, assigned_at: new Date().toISOString(), updated_by: 'driver' }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'assignment_accepted',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'requesting',
        next_status: 'accepted',
        message: '기사가 배차를 수락했습니다.',
        meta: { responseNote: responseNote || null }
      });
      return ok({ message: '배차 수락 완료' });
    }

    if (action === 'decline') {
      await supabase.from('assignments').update({ status: 'declined', responded_at: new Date().toISOString(), response_note: responseNote || null, updated_by: 'driver' }).eq('id', assignment.id);
      await supabase.from('jobs').update({ dispatch_status: 'reassign_needed', updated_by: 'system' }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'assignment_declined',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'requesting',
        next_status: 'reassign_needed',
        message: '기사가 배차를 거절했습니다.',
        meta: { responseNote: responseNote || null }
      });
      return ok({ message: '배차 거절 완료' });
    }

    return fail('action은 accept 또는 decline 이어야 합니다.');
  } catch (error) {
    return fail('기사 응답 처리 실패', error.message, 500);
  }
}
