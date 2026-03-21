import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

function basicAuth(secretKey) {
  return Buffer.from(`${secretKey}:`).toString('base64');
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { jobId, paymentKey, orderId, amount } = parseBody(event);
    if (!jobId || !orderId || !amount) return fail('jobId, orderId, amount가 필요합니다.');

    const secretKey = env('TOSS_SECRET_KEY', 'TOSS_WIDGET_SECRET_KEY');
    let paymentPayload;

    if (secretKey && paymentKey) {
      const res = await fetch(
        'https://api.tosspayments.com/v1/payments/confirm',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth(secretKey)}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) })
        }
      );
      const json = await res.json();
      if (!res.ok) {
        return fail('토스 결제 승인 실패', json, res.status || 500);
      }
      paymentPayload = json;
    } else {
      paymentPayload = {
        paymentKey: paymentKey || `mock_${Date.now()}`,
        orderId,
        totalAmount: Number(amount),
        method: 'mock-toss',
        status: 'DONE',
        mocked: true
      };
    }

    const supabase = adminClient();
    const { data: payment, error } = await supabase.from('payments').insert({
      job_id: jobId,
      payment_type: 'deposit',
      method: paymentPayload.method || 'toss',
      status: 'paid',
      amount: Number(amount),
      transaction_key: paymentPayload.paymentKey || null,
      paid_at: new Date().toISOString(),
      meta: paymentPayload
    }).select('*').single();
    if (error) throw error;

    await supabase
      .from('jobs')
      .update({ status: 'confirmed', updated_by: 'payment-confirm' })
      .eq('id', jobId);

    await supabase.from('dispatch_logs').insert({
      job_id: jobId,
      event_type: 'deposit_paid',
      actor_type: 'system',
      actor_name: 'toss-confirm',
      prev_status: 'deposit_pending',
      next_status: 'confirmed',
      message: '예약금 결제가 승인되었습니다.',
      meta: { orderId, amount: Number(amount), paymentKey: paymentPayload.paymentKey || null }
    });

    return ok({ payment, toss: paymentPayload });
  } catch (error) {
    return fail(
      '토스 결제 승인 실패',
      error.message,
      500
    );
  }
}
