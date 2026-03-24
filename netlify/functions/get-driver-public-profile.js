import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== 'GET') return fail('GET 요청만 허용됩니다.');

  try {
    const { driverId } = event?.queryStringParameters || {};
    if (!driverId) return fail('driverId가 필요합니다.');

    const supabase = adminClient();

    // Fetch only safe public fields — no phone, bank info, tokens, tax info
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, vehicle_type, supported_services, supports_move, supports_clean, supports_yd, completed_jobs, avg_rating, review_count, status')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) return fail('전문가를 찾을 수 없어요.');
    if (driver.status === 'inactive' || driver.status === 'blocked') {
      return fail('현재 활동 중인 전문가가 아니에요.');
    }

    // Fetch recent 5 reviews — no customer info
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (reviewsError) throw reviewsError;

    // Build services list for display
    const services = Array.isArray(driver.supported_services) && driver.supported_services.length
      ? driver.supported_services
      : [
          driver.supports_move !== false ? 'move' : null,
          driver.supports_clean ? 'clean' : null,
          driver.supports_yd ? 'yd' : null
        ].filter(Boolean);

    const publicDriver = {
      id: driver.id,
      name: driver.name,
      vehicle_type: driver.vehicle_type,
      services,
      completed_jobs: driver.completed_jobs || 0,
      avg_rating: driver.avg_rating || null,
      review_count: driver.review_count || 0
    };

    return ok({ driver: publicDriver, reviews: reviews || [] });
  } catch (error) {
    return fail('전문가 프로필 조회에 실패했어요.', error.message, 500);
  }
}
