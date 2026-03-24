import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { buildApprovedSettlementFields, calculateFreelancerWithholding } from '../../shared/settlements.js';
import { resolveRevenueSplit } from '../../shared/revenue.js';
import { sendSms } from '../../shared/sms.js';
import { sendEmail } from '../../shared/email.js';

async function loadJobByToken(supabase, token) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, assignments(*, drivers(*)), settlements(*)')
    .eq('customer_complete_token', token)
    .single();
  if (error) throw error;
  return data;
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
      return ok({ job });
    }

    if (event.httpMethod !== 'POST') return fail('GET 또는 POST 요청만 허용됩니다.');

    const { token, note } = parseBody(event);
    if (!token) return fail('token이 필요합니다.');

    const job = await loadJobByToken(supabase, token);
    if (job.status === 'completed') {
      return ok({ alreadyCompleted: true, job });
    }

    const dispatchReady = ['accepted', 'driver_departed', 'driver_arrived', 'in_progress', 'completion_requested'].includes(job.dispatch_status);
    const statusReady = ['assigned', 'in_progress'].includes(job.status);
    if (!dispatchReady && !statusReady) {
      return fail('아직 배차가 완료되지 않아 작업 완료 확인을 할 수 없어요.');
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        dispatch_status: 'completed',
        customer_completed_at: new Date().toISOString(),
        customer_completion_note: note || null,
        updated_by: 'customer-complete'
      })
      .eq('id', job.id)
      .neq('status', 'completed')
      .select('*');
    if (updateError) throw updateError;
    if (!updatedRows || updatedRows.length === 0) {
      const { data: latestJob } = await supabase.from('jobs').select('*').eq('id', job.id).single();
      return ok({ alreadyCompleted: true, job: latestJob || job });
    }
    const updatedJob = updatedRows[0];

    if (job.assigned_driver_id) {
      const existingSettlement = Array.isArray(job.settlements) ? job.settlements[0] : null;
      const revenueSplit = resolveRevenueSplit(job.total_price, job.company_amount, job.driver_amount, job.option_summary || {});
      const withholding = calculateFreelancerWithholding(revenueSplit.driverAmount || existingSettlement?.amount || 0);
      if (existingSettlement) {
        const { error: settlementError } = await supabase
          .from('settlements')
          .update({
            ...buildApprovedSettlementFields(new Date(), {
              amount: withholding.grossAmount,
              withholding_rate: withholding.withholdingRate,
              withholding_amount: withholding.withholdingAmount,
              net_amount: withholding.netAmount,
              driver_id: job.assigned_driver_id
            }),
            memo: note || '고객 완료 확인으로 정산 승인'
          })
          .eq('id', existingSettlement.id);
        if (settlementError) throw settlementError;
      } else {
        const { error: createSettlementError } = await supabase.from('settlements').insert({
          job_id: job.id,
          driver_id: job.assigned_driver_id,
          amount: withholding.grossAmount,
          withholding_rate: withholding.withholdingRate,
          withholding_amount: withholding.withholdingAmount,
          net_amount: withholding.netAmount,
          ...buildApprovedSettlementFields(new Date()),
          memo: note || '고객 완료 확인으로 정산 승인'
        });
        if (createSettlementError) throw createSettlementError;
      }

      const driver = job.assignments?.find((assignment) => assignment.driver_id === job.assigned_driver_id)?.drivers;
      const nextCompletedJobs = Number(driver?.completed_jobs || 0) + 1;
      await supabase
        .from('drivers')
        .update({ completed_jobs: nextCompletedJobs })
        .eq('id', job.assigned_driver_id);

      // 기사에게 정산 시작 SMS 발송
      if (driver?.phone) {
        const money = (v) => `${Number(v || 0).toLocaleString()}원`;
        const revenueSplit = resolveRevenueSplit(job.total_price, job.company_amount, job.driver_amount, job.option_summary || {});
        const withholding = calculateFreelancerWithholding(revenueSplit.driverAmount || 0);
        await sendSms(driver.phone, `[당고] 고객 완료 확인이 됐습니다. 정산 시작: 실지급 예정 ${money(withholding.netAmount)} (세전 ${money(withholding.grossAmount)}). 정산은 순서에 따라 진행돼요.`);
      }
    }

    await supabase.from('dispatch_logs').insert({
      job_id: job.id,
      driver_id: job.assigned_driver_id || null,
      event_type: 'customer_completed',
      actor_type: 'customer',
      actor_name: updatedJob.customer_name || 'customer',
      prev_status: job.status,
      next_status: 'completed',
      message: '고객이 작업 완료를 확인했습니다.',
      meta: { note: note || null }
    });

    // 서비스 완료 이메일 발송 (실패해도 완료 처리에 영향 없음)
    try {
      if (job.customer_email) {
        const reviewLink = `${process.env.SITE_URL || 'https://dang-o.kr'}/customer/complete.html?token=${encodeURIComponent(token)}`;
        await sendEmail({
          to: job.customer_email,
          subject: '당고 서비스 완료 안내',
          html: `<div style="font-family:sans-serif; max-width:560px; margin:0 auto; padding:24px;">
            <h2 style="color:#ed6b2f;">서비스가 완료됐어요!</h2>
            <p>안녕하세요, ${job.customer_name || '고객'}님.</p>
            <p>당고 서비스를 이용해주셔서 진심으로 감사합니다. 서비스 완료가 확인되었습니다.</p>
            <p style="margin:20px 0;">
              <a href="${reviewLink}" style="background:#ed6b2f; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:700;">리뷰 남기기</a>
            </p>
            <p style="color:#6e6255; font-size:14px;">서비스에 대한 의견을 남겨주시면 더 나은 서비스로 보답하겠습니다. 감사합니다.</p>
          </div>`
        });
      }
    } catch (emailErr) {
      console.error('[customer-complete] 이메일 발송 오류', emailErr.message);
    }

    return ok({ job: updatedJob });
  } catch (error) {
    return fail('고객 완료 확인 처리 실패', error.message, 500);
  }
}
