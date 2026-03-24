import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const body = parseBody(event);
    const { jobId, paymentType = 'deposit', method = 'toss', amount, status = 'paid', transactionKey } = body;
    if (!jobId || !amount) return fail('jobId, amount가 필요합니다.');

    const supabase = adminClient();

    if (transactionKey) {
      const { data: existing } = await supabase.from('payments').select('*').eq('transaction_key', transactionKey).maybeSingle();
      if (existing) return ok({ payment: existing, deduplicated: true });
    }

    const { data: payment, error } = await supabase.from('payments').insert({
      job_id: jobId,
      payment_type: paymentType,
      method,
      status,
      amount,
      transaction_key: transactionKey || null,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      failed_at: status === 'failed' ? new Date().toISOString() : null,
      meta: body
    }).select('*').single();
    if (error) throw error;

    if (status === 'paid' && paymentType === 'deposit') {
      await supabase.from('jobs').update({ status: 'confirmed', updated_by: 'payment-webhook' }).eq('id', jobId);
      await supabase.from('dispatch_logs').insert({
        job_id: jobId,
        event_type: 'deposit_paid',
        actor_type: 'system',
        actor_name: 'payment-webhook',
        prev_status: 'deposit_pending',
        next_status: 'confirmed',
        message: '예약금 결제가 완료되어 주문이 확정되었습니다.',
        meta: { payment_id: payment.id, amount }
      });
    }

    return ok({ payment });
  } catch (error) {
    return fail('결제 기록 실패', error.message, 500);
  }
}
