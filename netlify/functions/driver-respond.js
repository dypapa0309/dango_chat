import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { sendSms } from '../../shared/sms.js';
import { resolveDriver } from '../../shared/driver-auth.js';

const VEHICLE_SERVICES = ['move', 'yd', 'waste', 'install', 'interior', 'interior_help'];

async function updateAcceptanceRate(supabase, driverId) {
  try {
    const [{ count: acceptedCount }, { count: decidedCount }] = await Promise.all([
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('driver_id', driverId).eq('status', 'accepted'),
      supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('driver_id', driverId).in('status', ['accepted', 'declined'])
    ]);
    const rate = decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) / 100 : null;
    await supabase.from('drivers').update({ acceptance_rate: rate }).eq('id', driverId);
  } catch {}
}

function isDriverEligible(driver, serviceType) {
  if (!driver?.consign_contract_agreed) return false;
  if (VEHICLE_SERVICES.includes(serviceType) && !driver?.commercial_plate_confirmed) return false;
  return true;
}

function buildProgress(job) {
  return {
    status: job?.status || 'assigned',
    dispatchStatus: job?.dispatch_status || 'accepted',
    canDepart: ['accepted'].includes(job?.dispatch_status),
    canArrive: ['driver_departed'].includes(job?.dispatch_status),
    canStart: ['accepted', 'driver_departed', 'driver_arrived'].includes(job?.dispatch_status) && job?.status !== 'in_progress',
    canRequestComplete: ['in_progress', 'completion_requested'].includes(job?.dispatch_status) || job?.status === 'in_progress'
  };
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  const supabase = adminClient();

  try {
    if (event.httpMethod === 'GET') {
      const qs = event?.queryStringParameters || {};
      const dispatchToken = qs.token;
      const jobId = qs.jobId;

      let assignment, error;

      if (jobId) {
        // 새 방식: Bearer 세션 + jobId
        const resolved = await resolveDriver(event, null);
        if (!resolved) return fail('로그인이 필요합니다.', null, 401);
        ({ data: assignment, error } = await supabase
          .from('assignments')
          .select('*, jobs(*), drivers(*)')
          .eq('job_id', jobId)
          .eq('driver_id', resolved.driver.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single());
      } else if (dispatchToken) {
        // 레거시: SMS dispatch_token
        ({ data: assignment, error } = await supabase
          .from('assignments')
          .select('*, jobs(*), drivers(*)')
          .eq('dispatch_token', dispatchToken)
          .single());
      } else {
        return fail('jobId 또는 token이 필요합니다.');
      }
      if (error) throw error;
      if (!assignment) return fail('배차 요청을 찾을 수 없습니다.');
      if (assignment.status === 'accepted' && String(assignment.jobs?.assigned_driver_id || '') === String(assignment.driver_id || '')) {
        return ok({
          job: assignment.jobs,
          assignment,
          accepted: true,
          progress: buildProgress(assignment.jobs)
        });
      }
      if (assignment.status !== 'requested') {
        return ok({ handled: true, message: '이미 처리된 요청입니다.', job: assignment.jobs, assignment });
      }
      if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
        await supabase.from('assignments').update({ status: 'expired', updated_by: 'system' }).eq('id', assignment.id);
        await supabase.from('jobs').update({ dispatch_status: 'reassign_needed', updated_by: 'system' }).eq('id', assignment.job_id);
        return ok({ expired: true, message: '만료된 요청입니다.', job: assignment.jobs });
      }
      await supabase.from('assignments').update({ viewed_at: new Date().toISOString(), updated_by: 'driver' }).eq('id', assignment.id);
      if (!isDriverEligible(assignment.drivers, assignment.jobs?.service_type || 'move')) {
        const siteUrl = process.env.SITE_URL || 'http://localhost:8888';
        const joinUrl = assignment.drivers?.join_token
          ? `${siteUrl.replace(/\/$/, '')}/driver/join.html?token=${encodeURIComponent(assignment.drivers.join_token)}`
          : null;
        return ok({ job: assignment.jobs, assignment, agreementRequired: true, joinUrl });
      }
      return ok({ job: assignment.jobs, assignment, progress: buildProgress(assignment.jobs) });
    }

    if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');
    const { token, jobId: postJobId, action, responseNote } = parseBody(event);
    if (!action) return fail('action이 필요합니다.');

    let assignment, error;
    if (postJobId) {
      // 새 방식: Bearer + jobId
      const resolved = await resolveDriver(event, null);
      if (!resolved) return fail('로그인이 필요합니다.', null, 401);
      ({ data: assignment, error } = await supabase
        .from('assignments')
        .select('*, jobs(*), drivers(*)')
        .eq('job_id', postJobId)
        .eq('driver_id', resolved.driver.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single());
    } else if (token) {
      // 레거시: SMS dispatch_token
      ({ data: assignment, error } = await supabase
        .from('assignments')
        .select('*, jobs(*), drivers(*)')
        .eq('dispatch_token', token)
        .single());
    } else {
      return fail('jobId 또는 token이 필요합니다.');
    }
    if (error) throw error;
    if (!assignment) return fail('없는 요청입니다.');
    if (!isDriverEligible(assignment.drivers, assignment.jobs?.service_type || 'move')) {
      return fail('전문가 가입과 위탁운송 계약 동의가 먼저 필요합니다.');
    }

    if (action === 'accept') {
      if (assignment.status !== 'requested') return fail('이미 처리된 요청입니다.');
      await supabase.from('assignments').update({ status: 'accepted', responded_at: new Date().toISOString(), response_note: responseNote || null, updated_by: 'driver' }).eq('id', assignment.id);
      await supabase.from('assignments').update({ status: 'blocked', updated_by: 'system' }).eq('job_id', assignment.job_id).eq('status', 'requested').neq('id', assignment.id);
      await supabase.from('jobs').update({ status: 'assigned', dispatch_status: 'accepted', assigned_driver_id: assignment.driver_id, assigned_at: new Date().toISOString(), updated_by: 'driver' }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'assignment_accepted',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'requesting',
        next_status: 'accepted',
        message: '기사가 배차를 수락했습니다.',
        meta: { responseNote: responseNote || null }
      });
      await updateAcceptanceRate(supabase, assignment.driver_id);

      // 고객에게 기사 정보 SMS 발송
      const job = assignment.jobs;
      const driver = assignment.drivers;
      if (job?.customer_phone && driver?.name) {
        const SERVICE_LABEL = {
          move: '소형이사', clean: '입주청소', yd: '용달', waste: '폐기물',
          install: '설치', errand: '심부름', organize: '정리수납', ac_clean: '에어컨청소',
          appliance_clean: '가전청소', interior: '인테리어', interior_help: '인테리어 보조',
          pt: 'PT', vocal: '보컬', golf: '골프', tutor: '과외', counseling: '심리상담'
        };
        const serviceText = SERVICE_LABEL[job.service_type] || '서비스';
        const driverContact = driver.phone ? ` / 연락처: ${driver.phone}` : '';
        const smsText = `[당고] ${serviceText} 기사 배정 완료\n담당: ${driver.name}${driverContact}\n작업 관련 문의는 기사님께 직접 연락해주세요.`;
        await sendSms(job.customer_phone, smsText);
      }

      return ok({ message: '배차 수락 완료', progress: buildProgress({ ...assignment.jobs, status: 'assigned', dispatch_status: 'accepted' }) });
    }

    if (action === 'decline') {
      if (assignment.status !== 'requested') return fail('이미 처리된 요청입니다.');
      await supabase.from('assignments').update({ status: 'declined', responded_at: new Date().toISOString(), response_note: responseNote || null, updated_by: 'driver' }).eq('id', assignment.id);
      await supabase.from('jobs').update({ dispatch_status: 'reassign_needed', updated_by: 'system' }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'assignment_declined',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'requesting',
        next_status: 'reassign_needed',
        message: '기사가 배차를 거절했습니다.',
        meta: { responseNote: responseNote || null }
      });
      await updateAcceptanceRate(supabase, assignment.driver_id);
      return ok({ message: '배차 거절 완료' });
    }

    if (assignment.status !== 'accepted' || String(assignment.jobs?.assigned_driver_id || '') !== String(assignment.driver_id || '')) {
      return fail('현재 진행 중인 배차만 처리할 수 있어요.');
    }

    if (action === 'depart') {
      if (!['accepted'].includes(assignment.jobs?.dispatch_status)) return fail('출발 상태로 변경하려면 기사 수락 상태여야 해요.');
      await supabase.from('jobs').update({
        dispatch_status: 'driver_departed',
        driver_departed_at: new Date().toISOString(),
        updated_by: 'driver'
      }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'driver_departed',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'accepted',
        next_status: 'driver_departed',
        message: '기사가 출발 상태로 변경했습니다.',
        meta: { responseNote: responseNote || null }
      });
      return ok({ message: '출발 상태로 저장했어요.', progress: buildProgress({ ...assignment.jobs, dispatch_status: 'driver_departed' }) });
    }

    if (action === 'arrive') {
      if (!['driver_departed'].includes(assignment.jobs?.dispatch_status)) return fail('도착 상태로 변경하려면 출발 상태여야 해요.');
      await supabase.from('jobs').update({
        dispatch_status: 'driver_arrived',
        driver_arrived_at: new Date().toISOString(),
        updated_by: 'driver'
      }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'driver_arrived',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'driver_departed',
        next_status: 'driver_arrived',
        message: '기사가 도착 상태로 변경했습니다.',
        meta: { responseNote: responseNote || null }
      });
      return ok({ message: '도착 상태로 저장했어요.', progress: buildProgress({ ...assignment.jobs, dispatch_status: 'driver_arrived' }) });
    }

    if (action === 'start') {
      if (!['accepted', 'driver_departed', 'driver_arrived'].includes(assignment.jobs?.dispatch_status)) return fail('작업 시작은 기사 수락 이후에만 가능해요.');
      await supabase.from('jobs').update({
        status: 'in_progress',
        dispatch_status: 'in_progress',
        work_started_at: new Date().toISOString(),
        updated_by: 'driver'
      }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'work_started',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'driver_arrived',
        next_status: 'in_progress',
        message: '기사가 작업 시작 상태로 변경했습니다.',
        meta: { responseNote: responseNote || null }
      });
      return ok({ message: '작업 시작 상태로 저장했어요.', progress: buildProgress({ ...assignment.jobs, status: 'in_progress', dispatch_status: 'in_progress' }) });
    }

    if (action === 'request_complete') {
      if (!['in_progress', 'completion_requested'].includes(assignment.jobs?.dispatch_status) && assignment.jobs?.status !== 'in_progress') return fail('작업 완료 요청은 작업 중 상태에서만 가능해요.');
      await supabase.from('jobs').update({
        dispatch_status: 'completion_requested',
        driver_completion_requested_at: new Date().toISOString(),
        updated_by: 'driver'
      }).eq('id', assignment.job_id);
      await supabase.from('dispatch_logs').insert({
        job_id: assignment.job_id,
        assignment_id: assignment.id,
        driver_id: assignment.driver_id,
        event_type: 'driver_requested_completion',
        actor_type: 'driver',
        actor_id: String(assignment.driver_id),
        prev_status: assignment.jobs.dispatch_status || 'in_progress',
        next_status: 'completion_requested',
        message: '기사가 작업 완료 확인을 요청했습니다.',
        meta: { responseNote: responseNote || null }
      });
      return ok({ message: '고객 완료 확인 요청 상태로 바꿨어요.', progress: buildProgress({ ...assignment.jobs, status: 'in_progress', dispatch_status: 'completion_requested' }) });
    }

    return fail('action은 accept, decline, depart, arrive, start, request_complete 중 하나여야 합니다.');
  } catch (error) {
    return fail('기사 응답 처리 실패', error.message, 500);
  }
}
