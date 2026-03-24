import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

async function resolveJobId(supabase, senderType, token) {
  if (senderType === 'driver') {
    const { data } = await supabase
      .from('assignments')
      .select('job_id, driver_id, drivers(name)')
      .eq('dispatch_token', token)
      .in('status', ['accepted', 'requested', 'blocked'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return { jobId: data.job_id, senderName: data.drivers?.name || '전문가' };
  }
  if (senderType === 'customer') {
    const { data } = await supabase
      .from('jobs')
      .select('id, customer_name')
      .eq('customer_reject_token', token)
      .maybeSingle();
    if (data) return { jobId: data.id, senderName: data.customer_name || '고객' };

    const { data: data2 } = await supabase
      .from('jobs')
      .select('id, customer_name')
      .eq('customer_complete_token', token)
      .maybeSingle();
    if (data2) return { jobId: data2.id, senderName: data2.customer_name || '고객' };
    return null;
  }
  return null;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'GET') return fail('GET 요청만 허용됩니다.');

  const qs = event.queryStringParameters || {};
  const { token, sender_type: senderType } = qs;
  if (!token || !senderType) return fail('token, sender_type이 필요합니다.');

  const supabase = adminClient();
  const resolved = await resolveJobId(supabase, senderType, token);
  if (!resolved) return fail('유효하지 않은 토큰입니다.');

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_type, content, created_at')
    .eq('job_id', resolved.jobId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return fail('메시지를 불러오지 못했어요.', error.message, 500);

  return ok({ messages: messages || [] });
}
