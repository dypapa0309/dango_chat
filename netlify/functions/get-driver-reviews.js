import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== 'GET') return fail('GET 요청만 허용됩니다.');

  try {
    const { driverId, limit } = event?.queryStringParameters || {};
    if (!driverId) return fail('driverId가 필요합니다.');

    const pageLimit = Math.min(parseInt(limit || '10', 10), 50);

    const supabase = adminClient();

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(pageLimit);

    if (error) throw error;

    return ok({ reviews: reviews || [] });
  } catch (error) {
    return fail('리뷰 조회에 실패했어요.', error.message, 500);
  }
}
