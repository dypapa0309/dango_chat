import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const {
      metricDate,
      channel,
      spendAmount,
      leadSentCount,
      leadReadCount,
      refundCount,
      notes
    } = parseBody(event);

    if (!metricDate || !channel) return fail('metricDate와 channel이 필요합니다.');

    const supabase = adminClient();
    const payload = {
      metric_date: metricDate,
      channel: String(channel).trim().toLowerCase(),
      spend_amount: Number(spendAmount || 0),
      lead_sent_count: Number(leadSentCount || 0),
      lead_read_count: Number(leadReadCount || 0),
      refund_count: Number(refundCount || 0),
      notes: (notes || '').trim() || null
    };

    const { data, error } = await supabase
      .from('ad_channel_daily')
      .upsert(payload, { onConflict: 'metric_date,channel' })
      .select('*')
      .single();

    if (error) throw error;
    return ok({ row: data });
  } catch (error) {
    return fail('광고 데이터 저장 실패', error.message, 500);
  }
}
