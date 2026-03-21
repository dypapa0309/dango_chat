import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

function normalize(value) {
  return String(value || '').trim();
}

function canCancel(job) {
  return !['completed', 'canceled'].includes(job?.status) && job?.dispatch_status !== 'completed';
}

function canComplete(job) {
  return ['assigned', 'in_progress'].includes(job?.status) || ['accepted', 'driver_departed', 'driver_arrived', 'in_progress', 'completion_requested'].includes(job?.dispatch_status);
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { customerName, customerPhone } = parseBody(event);
    const name = normalize(customerName);
    const phone = normalize(customerPhone);
    if (!name || !phone) return fail('이름과 연락처를 입력해주세요.');

    const supabase = adminClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('id, customer_name, customer_phone, move_date, start_address, end_address, total_price, company_amount, driver_amount, status, dispatch_status, created_at, customer_complete_token, customer_cancel_token, payments(status, amount, paid_at), assignments(status, drivers(name, phone, vehicle_type, vehicle_number))')
      .eq('customer_name', name)
      .eq('customer_phone', phone)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(20);

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
    return fail('고객 주문 조회 실패', error.message, 500);
  }
}
