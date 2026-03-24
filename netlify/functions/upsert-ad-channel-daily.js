import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

function normalizeMetricAt(value) {
  if (!value) return '';
  if (/[zZ]$|[+\-]\d{2}:\d{2}$/.test(value)) return value;
  return `${value}:00+09:00`;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const {
      metricDate,
      metricAt,
      channel,
      spendAmount,
      leadSentCount,
      leadReadCount,
      refundCount,
      notes
    } = parseBody(event);

    if ((!metricDate && !metricAt) || !channel) return fail('metricAt 또는 metricDate와 channel이 필요합니다.');

    const supabase = adminClient();
    const resolvedMetricAt = normalizeMetricAt(metricAt || `${metricDate}T00:00`);
    const resolvedMetricDate = metricDate || String(resolvedMetricAt).slice(0, 10);
    const payload = {
      metric_date: resolvedMetricDate,
      metric_at: resolvedMetricAt,
      channel: String(channel).trim().toLowerCase(),
      spend_amount: Number(spendAmount || 0),
      lead_sent_count: Number(leadSentCount || 0),
      lead_read_count: Number(leadReadCount || 0),
      refund_count: Number(refundCount || 0),
      notes: (notes || '').trim() || null
    };

    const { data, error } = await supabase
      .from('ad_channel_daily')
      .upsert(payload, { onConflict: 'metric_date,channel', ignoreDuplicates: false })
      .select('*')
      .single();

    if (error) throw error;
    return ok({ row: data });
  } catch (error) {
    return fail('광고 데이터 저장 실패', error.message, 500);
  }
}
