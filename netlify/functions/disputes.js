import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  const supabase = adminClient();

  // GET — list disputes (admin) or get single by id
  if (event.httpMethod === 'GET') {
    const denied = requireAdmin(event);
    if (denied) return denied;

    const { id, status, jobId, limit: limitStr, offset: offsetStr } = event.queryStringParameters || {};
    const limit = Math.min(Number(limitStr) || 50, 100);
    const offset = Number(offsetStr) || 0;

    if (id) {
      const { data, error } = await supabase
        .from('disputes')
        .select('*, jobs(id, customer_name, service_type, start_address, status)')
        .eq('id', id)
        .single();
      if (error || !data) return fail('분쟁을 찾을 수 없어요.');
      return ok({ dispute: data });
    }

    let query = supabase
      .from('disputes')
      .select('*, jobs(id, customer_name, service_type, status)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (jobId) query = query.eq('job_id', jobId);

    const { data, error, count } = await query;
    if (error) throw error;
    return ok({ disputes: data || [], count });
  }

  // POST — create or update dispute
  if (event.httpMethod === 'POST') {
    try {
      const body = parseBody(event);
      const { action, id } = body;

      // Update (admin only)
      if (action === 'update' || id) {
        const denied = requireAdmin(event);
        if (denied) return denied;

        if (!id) return fail('id가 필요합니다.');
        const { status, priority, resolution, resolvedBy } = body;
        const updateFields = { updated_at: new Date().toISOString() };
        if (status) updateFields.status = status;
        if (priority) updateFields.priority = priority;
        if (resolution !== undefined) updateFields.resolution = resolution;
        if (status === 'resolved' || status === 'closed') {
          updateFields.resolved_at = new Date().toISOString();
          updateFields.resolved_by = resolvedBy || 'operator';
        }

        const { data, error } = await supabase
          .from('disputes')
          .update(updateFields)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return ok({ dispute: data });
      }

      // Create (open to customers + admin)
      const { jobId, driverId, customerName, customerPhone, category, title, description, priority } = body;
      if (!title) return fail('제목(title)이 필요합니다.');
      if (!description) return fail('내용(description)이 필요합니다.');

      const { data, error } = await supabase
        .from('disputes')
        .insert({
          job_id: jobId || null,
          driver_id: driverId || null,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          category: category || 'general',
          title,
          description,
          priority: priority || 'normal'
        })
        .select('*')
        .single();
      if (error) throw error;
      return ok({ dispute: data });
    } catch (error) {
      return fail('요청 처리 실패', error.message, 500);
    }
  }

  return fail('허용되지 않는 메서드입니다.');
}
