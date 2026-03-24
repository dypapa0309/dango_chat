import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { sendSms } from '../../shared/sms.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  try {
    const now = new Date().toISOString();
    const supabase = adminClient();
    const { data: rows, error } = await supabase.from('assignments').select('*, drivers(name, phone), jobs(service_type, move_date)').eq('status', 'requested').lt('expires_at', now);
    if (error) throw error;
    const jobIds = [...new Set((rows || []).map((v) => v.job_id))];
    if (rows?.length) {
      await supabase.from('assignments').update({ status: 'expired', updated_by: 'system' }).in('id', rows.map((v) => v.id));
      await supabase.from('jobs').update({ dispatch_status: 'reassign_needed', updated_by: 'system' }).in('id', jobIds);
      const logEntries = rows.map((v) => ({
        job_id: v.job_id,
        driver_id: v.driver_id || null,
        event_type: 'assignment_expired',
        actor_type: 'system',
        actor_name: 'expire-assignment',
        prev_status: 'requesting',
        next_status: 'reassign_needed',
        message: '배차 요청이 응답 시간 초과로 만료됐습니다.',
        meta: { assignment_id: v.id, expired_at: now }
      }));
      await supabase.from('dispatch_logs').insert(logEntries);

      // 만료된 기사들에게 SMS 발송 (중복 방지: 기사별 1회)
      const notifiedDrivers = new Set();
      for (const row of rows) {
        const phone = row.drivers?.phone;
        if (!phone || notifiedDrivers.has(phone)) continue;
        notifiedDrivers.add(phone);
        const SERVICE_LABEL = {
          move: '소형이사', clean: '입주청소', yd: '용달', waste: '폐기물',
          install: '설치', errand: '심부름', organize: '정리수납', ac_clean: '에어컨청소',
          appliance_clean: '가전청소', interior: '인테리어', interior_help: '인테리어 보조',
          pt: 'PT', vocal: '보컬', golf: '골프', tutor: '과외', counseling: '심리상담'
        };
        const serviceText = SERVICE_LABEL[row.jobs?.service_type] || '서비스';
        const dateText = row.jobs?.move_date ? ` (${row.jobs.move_date})` : '';
        await sendSms(phone, `[당고] ${serviceText}${dateText} 배차 요청이 응답 시간 초과로 만료됐습니다. 다음 배차 기회를 기다려 주세요.`);
      }
    }
    return ok({ expiredCount: rows?.length || 0, jobIds });
  } catch (error) {
    return fail('만료 처리 실패', error.message, 500);
  }
}
