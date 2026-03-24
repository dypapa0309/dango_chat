import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  try {
    const jobId = event?.queryStringParameters?.jobId;
    if (!jobId) return fail('jobId가 필요합니다.');

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        service_type,
        customer_name,
        move_date,
        start_address,
        end_address,
        total_price,
        status,
        dispatch_status,
        customer_reject_token,
        customer_rejection_count,
        assigned_driver_id,
        payments(status, amount, paid_at)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;

    // 배정된 기사 정보 조회
    let driver = null;
    if (data?.assigned_driver_id) {
      const { data: driverData } = await supabase
        .from('drivers')
        .select('name, phone, vehicle_type')
        .eq('id', data.assigned_driver_id)
        .maybeSingle();
      driver = driverData || null;
    }

    return ok({ job: { ...data, driver } });
  } catch (error) {
    return fail('주문 조회 실패', error.message, 500);
  }
}
