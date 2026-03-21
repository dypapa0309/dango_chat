import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { getSettlementPeriod } from '../../shared/settlements.js';
import { requireAdmin } from '../../shared/admin-auth.js';

function sumAmounts(items) {
  return items.reduce((acc, item) => acc + Number(item.amount || 0), 0);
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('settlements')
      .select(`
        id,
        job_id,
        driver_id,
        status,
        amount,
        approved_at,
        paid_at,
        held_at,
        hold_reason,
        memo,
        payout_period_key,
        payout_period_start,
        payout_period_end,
        payout_batch_key,
        paid_by,
        payout_memo,
        created_at,
        updated_at,
        drivers (
          id,
          name,
          phone,
          bank_name,
          account_number,
          account_holder,
          payout_enabled
        ),
        jobs (
          id,
          customer_name,
          move_date,
          start_address,
          end_address
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rows = data || [];
    const approvedGroupsMap = new Map();
    const held = [];
    const paid = [];

    rows.forEach((row) => {
      if (row.status === 'paid') {
        paid.push(row);
        return;
      }

      if (row.status === 'approved') {
        const period = getSettlementPeriod(row);
        const driverName = row.drivers?.name || '기사 미확인';
        const groupKey = `${row.driver_id || 'none'}:${period?.key || 'unknown'}`;
        if (!approvedGroupsMap.has(groupKey)) {
          approvedGroupsMap.set(groupKey, {
            groupKey,
            periodKey: period?.key || null,
            periodLabel: period?.label || '기간 미확인',
            periodStart: period?.startDate || null,
            periodEnd: period?.endDate || null,
            driverId: row.driver_id || null,
            driverName,
            driverPhone: row.drivers?.phone || null,
            bankName: row.drivers?.bank_name || null,
            accountNumber: row.drivers?.account_number || null,
            accountHolder: row.drivers?.account_holder || null,
            payoutEnabled: Boolean(row.drivers?.payout_enabled),
            items: []
          });
        }
        approvedGroupsMap.get(groupKey).items.push(row);
        return;
      }

      held.push(row);
    });

    const approvedGroups = Array.from(approvedGroupsMap.values())
      .map((group) => ({
        ...group,
        count: group.items.length,
        totalAmount: sumAmounts(group.items)
      }))
      .sort((a, b) => {
        const dateA = a.periodStart || '';
        const dateB = b.periodStart || '';
        return dateA < dateB ? 1 : -1;
      });

    const summary = {
      approvedCount: approvedGroups.reduce((acc, group) => acc + group.count, 0),
      approvedAmount: approvedGroups.reduce((acc, group) => acc + group.totalAmount, 0),
      heldCount: held.length,
      heldAmount: sumAmounts(held),
      paidCount: paid.length,
      paidAmount: sumAmounts(paid)
    };

    return ok({
      summary,
      approvedGroups,
      held,
      paid: paid.slice(0, 40)
    });
  } catch (error) {
    return fail('정산 대시보드 조회 실패', error.message, 500);
  }
}
