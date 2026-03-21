import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { getSettlementPeriod } from '../../shared/settlements.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const { driverId, periodKey, paidBy, memo } = parseBody(event);
    if (!driverId || !periodKey) return fail('driverId와 periodKey가 필요합니다.');

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('settlements')
      .select('id, driver_id, amount, status, approved_at, created_at, payout_period_key, payout_period_start, payout_period_end')
      .eq('driver_id', driverId)
      .eq('status', 'approved');

    if (error) throw error;

    const targetRows = (data || []).filter((row) => {
      const period = getSettlementPeriod(row);
      return period?.key === periodKey;
    });

    if (!targetRows.length) return fail('지급 완료 처리할 정산이 없습니다.');

    const representativePeriod = getSettlementPeriod(targetRows[0]);
    const batchKey = `manual-${periodKey}-${driverId}-${Date.now()}`;
    const ids = targetRows.map((row) => row.id);

    const { data: updated, error: updateError } = await supabase
      .from('settlements')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: (paidBy || 'operator').trim(),
        payout_memo: (memo || '운영자 수동 이체 완료').trim(),
        payout_batch_key: batchKey,
        payout_period_key: representativePeriod?.key || periodKey,
        payout_period_start: representativePeriod?.startDate || null,
        payout_period_end: representativePeriod?.endDate || null
      })
      .in('id', ids)
      .select('id, amount, status, paid_at, paid_by, payout_batch_key');

    if (updateError) throw updateError;

    return ok({
      settlements: updated || [],
      count: ids.length,
      totalAmount: targetRows.reduce((acc, row) => acc + Number(row.amount || 0), 0)
    });
  } catch (error) {
    return fail('지급 완료 처리 실패', error.message, 500);
  }
}
