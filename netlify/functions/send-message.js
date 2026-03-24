import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

const MAX_LENGTH = 1000;

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
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  const { sender_type: senderType, token, content } = parseBody(event);
  if (!senderType || !token || !content) return fail('sender_type, token, content가 필요합니다.');
  if (!['customer', 'driver'].includes(senderType)) return fail('sender_type은 customer 또는 driver여야 합니다.');
  if (typeof content !== 'string' || !content.trim()) return fail('내용을 입력해주세요.');
  if (content.length > MAX_LENGTH) return fail(`메시지는 ${MAX_LENGTH}자 이하로 입력해주세요.`);

  const supabase = adminClient();
  const resolved = await resolveJobId(supabase, senderType, token);
  if (!resolved) return fail('유효하지 않은 토큰입니다.');

  // 채팅 가능한 상태 확인 (accepted ~ completion_requested)
  const { data: job } = await supabase
    .from('jobs')
    .select('dispatch_status, status')
    .eq('id', resolved.jobId)
    .single();

  const CHAT_ALLOWED = new Set(['accepted', 'driver_departed', 'driver_arrived', 'in_progress', 'completion_requested']);
  if (job && !CHAT_ALLOWED.has(job.dispatch_status) && job.status !== 'in_progress') {
    return fail('현재 상태에서는 메시지를 보낼 수 없어요. 전문가가 배정된 후에 채팅이 가능해요.');
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ job_id: resolved.jobId, sender_type: senderType, content: content.trim() })
    .select('id, sender_type, content, created_at')
    .single();

  if (error) return fail('메시지 전송에 실패했어요.', error.message, 500);

  return ok({ message });
}
