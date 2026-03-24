import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { resolveRevenueSplit } from '../../shared/revenue.js';
import { sendEmail } from '../../shared/email.js';

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

    const supabase = adminClient();
    const paymentLookup = paymentKey
      ? supabase
          .from('payments')
          .select('*')
          .eq('transaction_key', paymentKey)
          .eq('payment_type', 'full_payment')
          .eq('status', 'paid')
          .limit(1)
          .maybeSingle()
      : supabase
          .from('payments')
          .select('*')
          .eq('job_id', jobId)
          .eq('payment_type', 'full_payment')
          .eq('status', 'paid')
          .limit(1)
          .maybeSingle();

    const { data: existingPayment, error: existingPaymentError } = await paymentLookup;
    if (existingPaymentError) throw existingPaymentError;
    if (existingPayment) {
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('customer_complete_token, customer_cancel_token')
        .eq('id', jobId)
        .single();
      return ok({
        payment: existingPayment,
        toss: existingPayment.meta || null,
        duplicated: true,
        customerCompleteToken: existingJob?.customer_complete_token || null,
        customerCancelToken: existingJob?.customer_cancel_token || null
      });
    }

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

    const { data: payment, error } = await supabase.from('payments').insert({
      job_id: jobId,
      payment_type: 'full_payment',
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
      message: '전체 결제가 승인되었습니다.',
      meta: { orderId, amount: Number(amount), paymentKey: paymentPayload.paymentKey || null }
    });

    const { data: job } = await supabase
      .from('jobs')
      .select('*, customer_complete_token, customer_cancel_token')
      .eq('id', jobId)
      .single();

    if (job?.assigned_driver_id || job?.driver_amount) {
      const revenueSplit = resolveRevenueSplit(job?.total_price, job?.company_amount, job?.driver_amount, job?.option_summary || {});
      const { data: existingSettlement } = await supabase
        .from('settlements')
        .select('*')
        .eq('job_id', jobId)
        .limit(1)
        .maybeSingle();

      if (existingSettlement) {
        await supabase
          .from('settlements')
          .update({
            amount: revenueSplit.driverAmount || existingSettlement.amount || 0,
            status: 'held',
            held_at: new Date().toISOString(),
            hold_reason: '고객 완료 확인 대기',
            memo: '전체 결제 후 기사 정산 대기'
          })
          .eq('id', existingSettlement.id);
      } else if (job?.assigned_driver_id) {
        await supabase.from('settlements').insert({
          job_id: jobId,
          driver_id: job.assigned_driver_id,
          amount: revenueSplit.driverAmount || 0,
          status: 'held',
          held_at: new Date().toISOString(),
          hold_reason: '고객 완료 확인 대기',
          memo: '전체 결제 후 기사 정산 대기'
        });
      }
    }

    // 결제 완료 이메일 발송 (실패해도 결제 응답에 영향 없음)
    try {
      if (job?.customer_email) {
        const money = (v) => `${Number(v || 0).toLocaleString()}원`;
        const SERVICE_LABEL = {
          move: '소형이사', clean: '입주청소', yd: '용달', waste: '폐기물', install: '설치',
          errand: '심부름', organize: '정리수납', ac_clean: '에어컨청소', appliance_clean: '가전청소',
          interior: '인테리어', interior_help: '인테리어 보조'
        };
        const svc = SERVICE_LABEL[job.service_type] || job.service_type || '서비스';
        const dateText = job.move_date ? `<p>작업일: <strong>${job.move_date}</strong></p>` : '';
        await sendEmail({
          to: job.customer_email,
          subject: '당고 결제 완료 안내',
          html: `<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
            <h2 style="color:#ed6b2f;">당고 결제가 완료됐어요!</h2>
            <p>안녕하세요, ${job.customer_name || '고객'}님.</p>
            <p>결제가 성공적으로 완료되었습니다. 아래 내용을 확인해주세요.</p>
            <div style="background:#f8f8f8; border-radius:12px; padding:16px; margin:16px 0;">
              <p>서비스: <strong>${svc}</strong></p>
              ${dateText}
              <p>결제 금액: <strong>${money(amount)}</strong></p>
            </div>
            <p style="color:#6e6255; font-size:14px;">배차가 완료되면 별도로 안내드릴게요. 감사합니다.</p>
          </div>`
        });
      }
    } catch (emailErr) {
      console.error('[confirm-toss-payment] 이메일 발송 오류', emailErr.message);
    }

    return ok({
      payment,
      toss: paymentPayload,
      customerCompleteToken: job?.customer_complete_token || null,
      customerCancelToken: job?.customer_cancel_token || null
    });
  } catch (error) {
    return fail(
      '토스 결제 승인 실패',
      error.message,
      500
    );
  }
}
