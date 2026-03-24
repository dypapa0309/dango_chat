import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { verifyAdminToken } from '../../shared/admin-auth.js';

function basicAuth(secretKey) {
  return Buffer.from(`${secretKey}:`).toString('base64');
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  const authError = verifyAdminToken(event);
  if (authError) return authError;

  try {
    const { jobId, cancelAmount, reason } = parseBody(event);
    if (!jobId) return fail('jobId가 필요합니다.');
    if (!reason) return fail('환불 사유를 입력해주세요.');

    const supabase = adminClient();

    // 결제 내역 조회
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('job_id', jobId)
      .eq('payment_type', 'full_payment')
      .in('status', ['paid', 'partial_refunded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) return fail('환불 가능한 결제 내역이 없어요.');
    if (payment.status === 'refunded') return fail('이미 전액 환불된 주문입니다.');

    const secretKey = env('TOSS_SECRET_KEY', 'TOSS_WIDGET_SECRET_KEY');
    if (!secretKey) return fail('Toss 시크릿 키가 설정되지 않았어요.');
    if (!payment.transaction_key) return fail('결제 키가 없어 Toss 환불을 진행할 수 없어요.');

    // 환불 금액 결정 (미입력 시 전액)
    const refundAmount = cancelAmount ? Number(cancelAmount) : null;
    const isPartial = refundAmount !== null && refundAmount < Number(payment.amount);

    const cancelBody = { cancelReason: reason };
    if (isPartial) cancelBody.cancelAmount = refundAmount;

    // Toss 환불 API 호출
    const cancelRes = await fetch(
      `https://api.tosspayments.com/v1/payments/${encodeURIComponent(payment.transaction_key)}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth(secretKey)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cancelBody)
      }
    );
    const cancelJson = await cancelRes.json();
    if (!cancelRes.ok) return fail('Toss 환불 실패', cancelJson, cancelRes.status || 500);

    // 결제 상태 업데이트
    const newPaymentStatus = isPartial ? 'partial_refunded' : 'refunded';
    await supabase.from('payments').update({
      status: newPaymentStatus,
      refunded_at: new Date().toISOString(),
      meta: { ...(payment.meta || {}), cancel: cancelJson, refund_reason: reason }
    }).eq('id', payment.id);

    // 전액 환불 시 주문 취소 처리
    if (!isPartial) {
      await supabase.from('jobs').update({
        status: 'canceled',
        dispatch_status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_reason: reason,
        updated_by: 'admin_refund'
      }).eq('id', jobId);

      await supabase.from('assignments')
        .update({ status: 'canceled', updated_by: 'admin_refund' })
        .eq('job_id', jobId)
        .in('status', ['requested', 'accepted']);

      await supabase.from('settlements')
        .update({ status: 'canceled', hold_reason: reason, memo: `어드민 환불: ${reason}` })
        .eq('job_id', jobId);
    }

    await supabase.from('dispatch_logs').insert({
      job_id: jobId,
      event_type: isPartial ? 'partial_refund' : 'admin_refund',
      actor_type: 'admin',
      actor_name: 'admin',
      prev_status: payment.status,
      next_status: newPaymentStatus,
      message: `어드민 환불 (${isPartial ? `부분 ${refundAmount?.toLocaleString()}원` : '전액'}): ${reason}`,
      meta: { cancelJson, refundAmount }
    });

    return ok({
      refunded: true,
      partial: isPartial,
      refundAmount: refundAmount || Number(payment.amount),
      reason
    });
  } catch (error) {
    return fail('환불 처리 실패', error.message, 500);
  }
}
