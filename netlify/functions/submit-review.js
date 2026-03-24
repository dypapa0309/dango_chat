import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { token, rating, comment } = parseBody(event);

    if (!token) return fail('token이 필요합니다.');
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return fail('rating은 1~5 사이의 숫자여야 합니다.');
    }
    if (comment && comment.length > 500) {
      return fail('댓글은 500자 이하로 작성해주세요.');
    }

    const supabase = adminClient();

    // Look up job by customer_complete_token
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, assigned_driver_id')
      .eq('customer_complete_token', token)
      .single();

    if (jobError || !job) return fail('주문을 찾을 수 없어요.');
    if (job.status !== 'completed') return fail('완료된 주문에만 리뷰를 남길 수 있어요.');
    if (!job.assigned_driver_id) return fail('배정된 기사가 없어요.');

    // Check if review already exists
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('job_id', job.id)
      .maybeSingle();

    if (existing) return fail('이미 리뷰를 남긴 주문이에요.');

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        job_id: job.id,
        driver_id: job.assigned_driver_id,
        rating,
        comment: comment ? comment.trim() : null
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') return fail('이미 리뷰를 남긴 주문이에요.');
      throw insertError;
    }

    // Recalculate avg_rating and review_count for driver
    const { data: aggData, error: aggError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('driver_id', job.assigned_driver_id);

    if (!aggError && aggData) {
      const count = aggData.length;
      const avg = aggData.reduce((sum, r) => sum + r.rating, 0) / count;
      await supabase
        .from('drivers')
        .update({
          avg_rating: Math.round(avg * 100) / 100,
          review_count: count
        })
        .eq('id', job.assigned_driver_id);
    }

    return ok({ review });
  } catch (error) {
    return fail('리뷰 등록에 실패했어요.', error.message, 500);
  }
}
