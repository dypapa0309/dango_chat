import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

function formatWon(v) {
  return `${Number(v || 0).toLocaleString('ko-KR')}원`;
}

function formatDate(v) {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const SERVICE_LABEL = {
  move: '이사', clean: '청소', yd: '용달', waste: '폐기물',
  install: '설치', errand: '심부름', organize: '정리수납',
  ac_clean: '에어컨청소', appliance_clean: '가전청소', interior: '인테리어',
  interior_help: '인테리어 보조', pt: 'PT', vocal: '보컬', golf: '골프',
  tutor: '과외', counseling: '심리상담', marketing: '마케팅'
};

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'GET') return fail('GET 요청만 허용됩니다.');

  const { token } = event.queryStringParameters || {};
  if (!token) return fail('token이 필요합니다.');

  try {
    const supabase = adminClient();
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*, payments(status, amount, paid_at, payment_key), assignments(status, drivers(name, phone, vehicle_type))')
      .eq('customer_complete_token', token)
      .single();

    if (error || !job) return fail('주문을 찾을 수 없어요.');
    if (job.status !== 'completed') return fail('완료된 주문에만 영수증을 발급할 수 있어요.');

    const payment = (job.payments || []).find((p) => p.status === 'paid');
    const driver = (job.assignments || []).find((a) => a.status === 'accepted')?.drivers;

    const receipt = {
      receiptNumber: `DANGO-${job.id.slice(0, 8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      service: SERVICE_LABEL[job.service_type] || job.service_type,
      moveDate: formatDate(job.move_date),
      customerName: job.customer_name,
      startAddress: job.start_address,
      endAddress: job.end_address,
      totalPrice: formatWon(job.total_price),
      depositAmount: formatWon(job.deposit_amount),
      balanceAmount: formatWon(job.balance_amount),
      paidAt: payment ? formatDate(payment.paid_at) : null,
      driverName: driver?.name || null,
      driverVehicleType: driver?.vehicle_type || null,
      completedAt: formatDate(job.customer_completed_at),
      raw: {
        jobId: job.id,
        totalPrice: job.total_price,
        depositAmount: job.deposit_amount,
        balanceAmount: job.balance_amount,
        serviceType: job.service_type
      }
    };

    return ok({ receipt });
  } catch (error) {
    return fail('영수증 조회 실패', error.message, 500);
  }
}
