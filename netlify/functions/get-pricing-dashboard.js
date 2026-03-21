import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { ensurePricingStateRow, recommendPricingAdjustment } from '../../shared/pricing-state.js';

function isoDateOnly(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  try {
    const days = Math.max(3, Math.min(30, Number(event?.queryStringParameters?.days || 14)));
    const fromDate = isoDateOnly(days);
    const supabase = adminClient();
    const state = await ensurePricingStateRow(supabase);

    const { data: adRows, error: adError } = await supabase
      .from('ad_channel_daily')
      .select('*')
      .gte('metric_date', fromDate)
      .order('metric_date', { ascending: false });
    if (adError) throw adError;

    const paidChannels = Array.from(new Set((adRows || []).filter((row) => Number(row.spend_amount || 0) > 0).map((row) => row.channel)));

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, total_price, company_amount, acquisition_source, created_at')
      .gte('created_at', `${fromDate}T00:00:00.000Z`);
    if (jobsError) throw jobsError;

    const channelJobs = (jobs || []).filter((job) => paidChannels.length ? paidChannels.includes(job.acquisition_source) : false);
    const jobMap = new Map(channelJobs.map((job) => [job.id, job]));

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('job_id, amount, status, paid_at')
      .eq('status', 'paid')
      .gte('paid_at', `${fromDate}T00:00:00.000Z`);
    if (paymentsError) throw paymentsError;

    const paidJobIds = new Set((payments || []).filter((payment) => jobMap.has(payment.job_id)).map((payment) => payment.job_id));
    const paidOrders = paidJobIds.size;
    const paidRevenue = Array.from(paidJobIds).reduce((acc, id) => acc + Number(jobMap.get(id)?.total_price || 0), 0);
    const companyRevenue = Array.from(paidJobIds).reduce((acc, id) => acc + Number(jobMap.get(id)?.company_amount || 0), 0);
    const spend = (adRows || []).reduce((acc, row) => acc + Number(row.spend_amount || 0), 0);
    const sentLeads = (adRows || []).reduce((acc, row) => acc + Number(row.lead_sent_count || 0), 0);
    const readLeads = (adRows || []).reduce((acc, row) => acc + Number(row.lead_read_count || 0), 0);

    const recommendation = recommendPricingAdjustment(state, {
      spend,
      sentLeads,
      readLeads,
      paidOrders,
      paidRevenue,
      companyRevenue
    });

    const byChannelMap = new Map();
    (adRows || []).forEach((row) => {
      if (!byChannelMap.has(row.channel)) {
        byChannelMap.set(row.channel, {
          channel: row.channel,
          spendAmount: 0,
          leadSentCount: 0,
          leadReadCount: 0,
          refundCount: 0,
          paidOrders: 0,
          paidRevenue: 0,
          companyRevenue: 0
        });
      }
      const bucket = byChannelMap.get(row.channel);
      bucket.spendAmount += Number(row.spend_amount || 0);
      bucket.leadSentCount += Number(row.lead_sent_count || 0);
      bucket.leadReadCount += Number(row.lead_read_count || 0);
      bucket.refundCount += Number(row.refund_count || 0);
    });

    channelJobs.forEach((job) => {
      const channel = job.acquisition_source || 'direct';
      if (!byChannelMap.has(channel)) {
        byChannelMap.set(channel, {
          channel,
          spendAmount: 0,
          leadSentCount: 0,
          leadReadCount: 0,
          refundCount: 0,
          paidOrders: 0,
          paidRevenue: 0,
          companyRevenue: 0
        });
      }
      if (paidJobIds.has(job.id)) {
        const bucket = byChannelMap.get(channel);
        bucket.paidOrders += 1;
        bucket.paidRevenue += Number(job.total_price || 0);
        bucket.companyRevenue += Number(job.company_amount || 0);
      }
    });

    return ok({
      state,
      metrics: {
        days,
        fromDate,
        spend,
        sentLeads,
        readLeads,
        paidOrders,
        paidRevenue,
        companyRevenue
      },
      recommendation,
      channels: Array.from(byChannelMap.values()).sort((a, b) => b.spendAmount - a.spendAmount),
      adRows: adRows || []
    });
  } catch (error) {
    return fail('가격 대시보드 조회 실패', error.message, 500);
  }
}
