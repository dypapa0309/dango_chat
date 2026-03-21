import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

function basicAuth(secretKey) {
  return Buffer.from(`${secretKey}:`).toString('base64');
}

async function loadJobByToken(supabase, token) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, assignments(*), payments(*), settlements(*)')
    .eq('customer_cancel_token', token)
    .single();
  if (error) throw error;
  return data;
}

function canCustomerCancel(job) {
  if (!job) return false;
  if (job.status === 'completed' || job.status === 'canceled') return false;
  if (job.status === 'in_progress') return false;
  return true;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  try {
    const supabase = adminClient();

    if (event.httpMethod === 'GET') {
      const token = event?.queryStringParameters?.token;
      if (!token) return fail('token이 필요합니다.');
      const job = await loadJobByToken(supabase, token);
      return ok({ job, cancelable: canCustomerCancel(job) });
    }

    if (event.httpMethod !== 'POST') return fail('GET 또는 POST 요청만 허용됩니다.');

    const { token, reason } = parseBody(event);
    if (!token) return fail('token이 필요합니다.');

    const job = await loadJobByToken(supabase, token);
    if (!canCustomerCancel(job)) {
      return fail('이미 작업이 시작되었거나 완료되어 자동 취소할 수 없습니다.');
    }

    const paidPayment = (job.payments || []).find((payment) => payment.status === 'paid');
    const secretKey = env('TOSS_SECRET_KEY', 'TOSS_WIDGET_SECRET_KEY');
    let cancelPayload = null;

    if (paidPayment?.transaction_key && secretKey) {
      const cancelRes = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paidPayment.transaction_key)}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth(secretKey)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancelReason: reason || '고객 취소 요청'
        })
      });
      const cancelJson = await cancelRes.json();
      if (!cancelRes.ok) {
        return fail('결제 취소 실패', cancelJson, cancelRes.status || 500);
      }
      cancelPayload = cancelJson;

      await supabase
        .from('payments')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          meta: { ...(paidPayment.meta || {}), cancel: cancelJson }
        })
        .eq('id', paidPayment.id);
    }

    await supabase
      .from('assignments')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_reason: reason || '고객 취소',
        updated_by: 'customer-cancel'
      })
      .eq('job_id', job.id)
      .in('status', ['requested', 'accepted']);

    await supabase
      .from('jobs')
      .update({
        status: 'canceled',
        dispatch_status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_reason: reason || '고객 취소',
        customer_canceled_at: new Date().toISOString(),
        customer_cancel_note: reason || null,
        updated_by: 'customer-cancel'
      })
      .eq('id', job.id);

    await supabase
      .from('settlements')
      .update({
        status: 'canceled',
        hold_reason: '고객 취소로 정산 취소',
        memo: reason || '고객 취소로 정산 취소'
      })
      .eq('job_id', job.id);

    await supabase.from('dispatch_logs').insert({
      job_id: job.id,
      driver_id: job.assigned_driver_id || null,
      event_type: 'customer_canceled',
      actor_type: 'customer',
      actor_name: job.customer_name || 'customer',
      prev_status: job.status,
      next_status: 'canceled',
      message: '고객이 주문을 취소했습니다.',
      meta: { reason: reason || null, refund: cancelPayload }
    });

    return ok({ canceled: true, refunded: Boolean(cancelPayload), refund: cancelPayload });
  } catch (error) {
    return fail('고객 취소 처리 실패', error.message, 500);
  }
}
