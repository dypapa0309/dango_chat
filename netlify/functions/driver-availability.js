import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  const supabase = adminClient();
  const qs = event.queryStringParameters || {};

  // GET — get availability for a driver or a date range
  if (event.httpMethod === 'GET') {
    const { token, driverId, from, to } = qs;

    let resolvedDriverId = driverId;
    if (!resolvedDriverId && token) {
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .or(`join_token.eq.${token},dispatch_token.eq.${token}`)
        .maybeSingle();
      resolvedDriverId = driver?.id;
    }
    if (!resolvedDriverId) return fail('driverId 또는 token이 필요합니다.');

    let query = supabase
      .from('driver_availability')
      .select('*')
      .eq('driver_id', resolvedDriverId)
      .order('date', { ascending: true });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query;
    if (error) throw error;
    return ok({ availability: data || [] });
  }

  // POST — upsert availability dates for a driver (driver self-service via token)
  if (event.httpMethod === 'POST') {
    try {
      const body = parseBody(event);
      const { token, dates } = body;
      // dates: [{ date: '2026-04-01', is_available: false, note: '개인 사정' }]

      if (!token) return fail('token이 필요합니다.');
      if (!Array.isArray(dates) || !dates.length) return fail('dates 배열이 필요합니다.');
      if (dates.length > 60) return fail('한 번에 최대 60일까지 설정할 수 있어요.');

      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .or(`join_token.eq.${token},dispatch_token.eq.${token}`)
        .maybeSingle();
      if (!driver) return fail('유효하지 않은 토큰이에요.');

      const rows = dates.map((d) => ({
        driver_id: driver.id,
        date: d.date,
        is_available: d.is_available !== false,
        note: d.note || null
      }));

      const { data, error } = await supabase
        .from('driver_availability')
        .upsert(rows, { onConflict: 'driver_id,date' })
        .select('*');
      if (error) throw error;
      return ok({ availability: data });
    } catch (error) {
      return fail('일정 저장 실패', error.message, 500);
    }
  }

  return fail('허용되지 않는 메서드입니다.');
}
