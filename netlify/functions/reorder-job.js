import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { mustEnv } from '../../shared/env.js';

async function resolveAuthUser(event) {
  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) return null;
    const userClient = createClient(mustEnv('SUPABASE_URL'), mustEnv('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY'));
    const { data: { user } } = await userClient.auth.getUser(accessToken);
    return user || null;
  } catch {
    return null;
  }
}

function normalize(value) {
  return String(value || '').trim();
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const body = parseBody(event);
    const { originalJobId, customerName, customerPhone, token } = body;
    const authUser = await resolveAuthUser(event);
    const supabase = adminClient();

    let originalJob;

    if (token) {
      // Look up by customer_complete_token
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('customer_complete_token', token)
        .single();
      if (error || !data) return fail('해당 토큰으로 주문을 찾을 수 없어요.');
      originalJob = data;
    } else {
      if (!originalJobId) return fail('originalJobId 또는 token이 필요합니다.');
      const name = normalize(customerName);
      const phone = normalize(customerPhone);
      if (!name || !phone) return fail('이름과 연락처를 입력해주세요.');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', originalJobId)
        .single();
      if (error || !data) return fail('주문을 찾을 수 없어요.');

      // Verify customer identity
      if (normalize(data.customer_name) !== name || normalize(data.customer_phone) !== phone) {
        return fail('이름 또는 연락처가 일치하지 않아요.');
      }
      originalJob = data;
    }

    // Only allow reorder for completed or canceled jobs
    if (!['completed', 'canceled'].includes(originalJob.status)) {
      return fail('완료 또는 취소된 주문만 재접수할 수 있어요.');
    }

    const newPayload = {
      service_type: originalJob.service_type,
      customer_name: originalJob.customer_name,
      customer_phone: originalJob.customer_phone,
      customer_note: originalJob.customer_note || null,
      move_date: null,
      start_address: originalJob.start_address,
      start_address_detail: originalJob.start_address_detail || null,
      start_lat: originalJob.start_lat || 0,
      start_lng: originalJob.start_lng || 0,
      end_address: originalJob.end_address,
      end_address_detail: originalJob.end_address_detail || null,
      end_lat: originalJob.end_lat || 0,
      end_lng: originalJob.end_lng || 0,
      via_address: originalJob.via_address || null,
      item_summary: originalJob.item_summary || {},
      option_summary: originalJob.option_summary || {},
      raw_text: originalJob.raw_text || null,
      // Price will be recalculated at payment time; copy snapshot for reference
      price_snapshot: originalJob.price_snapshot || null,
      price_version: originalJob.price_version || null,
      total_price: originalJob.total_price || 0,
      deposit_amount: originalJob.deposit_amount || 0,
      balance_amount: originalJob.balance_amount || 0,
      driver_amount: originalJob.driver_amount || 0,
      company_amount: originalJob.company_amount || 0,
      customer_complete_token: crypto.randomUUID(),
      customer_cancel_token: crypto.randomUUID(),
      acquisition_source: 'reorder',
      acquisition_medium: null,
      acquisition_campaign: null,
      status: 'deposit_pending',
      dispatch_status: 'idle',
      created_by: 'reorder',
      updated_by: 'reorder',
      ...(authUser?.id ? { user_id: authUser.id } : (originalJob.user_id ? { user_id: originalJob.user_id } : {})),
      ...(authUser?.email ? { customer_email: authUser.email } : (originalJob.customer_email ? { customer_email: originalJob.customer_email } : {}))
    };

    let { data: newJob, error: insertError } = await supabase
      .from('jobs')
      .insert(newPayload)
      .select('*')
      .single();

    if (insertError && /customer_(complete|cancel)_token/i.test(insertError.message || '')) {
      const {
        customer_complete_token,
        customer_cancel_token,
        ...fallbackPayload
      } = newPayload;
      ({ data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert(fallbackPayload)
        .select('*')
        .single());
    }

    if (insertError) throw insertError;

    return ok({
      jobId: newJob.id,
      payUrl: `/customer/pay.html?jobId=${newJob.id}`
    });
  } catch (error) {
    return fail('재접수 생성 실패', error.message, 500);
  }
}
