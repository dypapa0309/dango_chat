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
        customer_name,
        customer_phone,
        move_date,
        start_address,
        end_address,
        total_price,
        company_amount,
        driver_amount,
        status,
        dispatch_status,
        customer_complete_token,
        customer_cancel_token,
        payments(status, amount, paid_at)
      `)
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return ok({ job: data });
  } catch (error) {
    return fail('주문 조회 실패', error.message, 500);
  }
}
