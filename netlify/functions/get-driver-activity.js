import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { resolveDriver } from '../../shared/driver-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  const token = event.queryStringParameters?.token || null;

  try {
    const resolved = await resolveDriver(event, token);
    if (!resolved) return fail('로그인이 필요하거나 유효하지 않은 토큰입니다.', null, 401);
    const { driver, supabase } = resolved;

    // 기사의 주문 조회 (assignment를 통해)
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*, jobs(id, service_type, status, dispatch_status, move_date, start_address, end_address, total_price, customer_name)')
      .eq('driver_id', driver.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (assignError) throw assignError;

    // 정산 현황
    const { data: settlements, error: settleError } = await supabase
      .from('settlements')
      .select('id, status, driver_net_amount, payout_period_key, paid_at, created_at')
      .eq('driver_id', driver.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (settleError) throw settleError;

    const totalEarned = (settlements || [])
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + Number(s.driver_net_amount || 0), 0);
    const pendingAmount = (settlements || [])
      .filter((s) => ['approved', 'held'].includes(s.status))
      .reduce((sum, s) => sum + Number(s.driver_net_amount || 0), 0);

    return ok({
      driver,
      assignments: assignments || [],
      settlements: settlements || [],
      summary: { totalEarned, pendingAmount }
    });
  } catch (error) {
    return fail('활동 정보를 불러오지 못했어요.', error.message, 500);
  }
}
