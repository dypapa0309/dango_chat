import { createClient } from '@supabase/supabase-js';
import { adminClient } from '../../shared/db.js';
import { mustEnv, env } from '../../shared/env.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

function canCancel(job) {
  return !['completed', 'canceled'].includes(job?.status) && job?.dispatch_status !== 'completed';
}

function canComplete(job) {
  return ['assigned', 'in_progress'].includes(job?.status) ||
    ['accepted', 'driver_departed', 'driver_arrived', 'in_progress', 'completion_requested'].includes(job?.dispatch_status);
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'GET') return fail('GET 요청만 허용됩니다.');

  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) return fail('인증 토큰이 필요합니다.', null, 401);

    // Verify the user's identity with their own token
    const userClient = createClient(
      mustEnv('SUPABASE_URL'),
      mustEnv('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY')
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !user) return fail('유효하지 않은 인증 토큰이에요.', null, 401);

    // Query jobs by user_id using admin client
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('id, customer_name, customer_phone, service_type, move_date, start_address, end_address, total_price, status, dispatch_status, created_at, customer_complete_token, customer_cancel_token, payments(status, amount, paid_at), assignments(status, drivers(name, phone, vehicle_type, vehicle_number))')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const jobs = (data || []).map((job) => {
      const paid = (job.payments || []).some((payment) => payment.status === 'paid');
      const acceptedAssignment = (job.assignments || []).find((assignment) => assignment.status === 'accepted');
      return {
        ...job,
        paid,
        driver: acceptedAssignment?.drivers || null,
        actions: {
          canPay: !paid && job.status === 'deposit_pending',
          canCancel: canCancel(job) && !!job.customer_cancel_token,
          canComplete: canComplete(job) && !!job.customer_complete_token
        }
      };
    });

    return ok({ jobs });
  } catch (error) {
    return fail('주문 조회 실패', error.message, 500);
  }
}
