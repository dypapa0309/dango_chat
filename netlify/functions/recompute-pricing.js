import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { ensurePricingStateRow, recommendPricingAdjustment } from '../../shared/pricing-state.js';
import { requireAdmin } from '../../shared/admin-auth.js';

function hoursAgo(hours) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function isoDateTime(value) {
  return new Date(value).toISOString();
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const isScheduled = !event.httpMethod;
  if (!isScheduled) {
    const denied = requireAdmin(event);
    if (denied) return denied;
  }

  try {
    const body = parseBody(event);
    const hours = Math.max(24, Math.min(240, Number(body.hours || event?.queryStringParameters?.hours || 50)));
    const forced = body.force === true || event?.queryStringParameters?.force === 'true';
    const supabase = adminClient();
    const state = await ensurePricingStateRow(supabase);

    if (!forced && state.mode !== 'auto') {
      return ok({ skipped: true, state, reason: '수동 모드라 자동 조정을 건너뜀' });
    }

    const fromDateTime = isoDateTime(hoursAgo(hours));

    const { data: adRows, error: adError } = await supabase
      .from('ad_channel_daily')
      .select('*')
      .gte('metric_at', fromDateTime);
    if (adError) throw adError;

    const paidChannels = Array.from(new Set((adRows || []).filter((row) => Number(row.spend_amount || 0) > 0).map((row) => row.channel)));

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, total_price, company_amount, acquisition_source, created_at')
      .gte('created_at', fromDateTime);
    if (jobsError) throw jobsError;

    const channelJobs = (jobs || []).filter((job) => paidChannels.length ? paidChannels.includes(job.acquisition_source) : false);
    const jobMap = new Map(channelJobs.map((job) => [job.id, job]));

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('job_id, amount, status, paid_at')
      .eq('status', 'paid')
      .gte('paid_at', fromDateTime);
    if (paymentsError) throw paymentsError;

    const paidRows = (payments || []).filter((payment) => jobMap.has(payment.job_id));
    const paidJobIds = new Set(paidRows.map((row) => row.job_id));

    const spend = (adRows || []).reduce((acc, row) => acc + Number(row.spend_amount || 0), 0);
    const sentLeads = (adRows || []).reduce((acc, row) => acc + Number(row.lead_sent_count || 0), 0);
    const readLeads = (adRows || []).reduce((acc, row) => acc + Number(row.lead_read_count || 0), 0);
    const paidOrders = paidJobIds.size;
    const paidRevenue = Array.from(paidJobIds).reduce((acc, jobId) => acc + Number(jobMap.get(jobId)?.total_price || 0), 0);
    const companyRevenue = Array.from(paidJobIds).reduce((acc, jobId) => acc + Number(jobMap.get(jobId)?.company_amount || 0), 0);

    const recommendation = recommendPricingAdjustment(state, {
      spend,
      sentLeads,
      readLeads,
      paidOrders,
      paidRevenue,
      companyRevenue
    });

    const snapshot = {
      hours,
      fromDateTime,
      paidChannels,
      ...recommendation.metrics
    };

    const { data: updatedState, error: updateError } = await supabase
      .from('pricing_state')
      .update({
        current_multiplier: recommendation.nextMultiplier,
        last_reason: recommendation.reason,
        last_metrics: snapshot,
        last_evaluated_at: new Date().toISOString()
      })
      .eq('key', state.key)
      .select('*')
      .single();
    if (updateError) throw updateError;

    if (recommendation.change !== 0) {
      const { error: adjustmentError } = await supabase.from('pricing_adjustments').insert({
        state_key: state.key,
        previous_multiplier: recommendation.currentMultiplier,
        next_multiplier: recommendation.nextMultiplier,
        change_amount: recommendation.change,
        reason: recommendation.reason,
        metrics: snapshot,
        created_by: forced ? 'manual-trigger' : 'auto-trigger'
      });
      if (adjustmentError) throw adjustmentError;
    }

    return ok({
      state: updatedState,
      recommendation,
      snapshot
    });
  } catch (error) {
    return fail('가격 배율 재계산 실패', error.message, 500);
  }
}
