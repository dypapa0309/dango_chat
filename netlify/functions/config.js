import { publicConfig } from '../../shared/db.js';
import { adminClient } from '../../shared/db.js';
import { env } from '../../shared/env.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { ensurePricingStateRow } from '../../shared/pricing-state.js';

async function maybeRefreshPricingState(supabase, state) {
  if (!state || state.mode !== 'auto') return state;

  const lastEvaluatedAt = state.last_evaluated_at ? new Date(state.last_evaluated_at).getTime() : 0;
  const sixHours = 6 * 60 * 60 * 1000;
  if (lastEvaluatedAt && (Date.now() - lastEvaluatedAt) < sixHours) return state;

  const response = await fetch(`${env('SITE_URL', 'http://localhost:8888')}/.netlify/functions/recompute-pricing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env('ADMIN_TOKEN', '') ? { Authorization: `Bearer ${env('ADMIN_TOKEN', '')}` } : {})
    },
    body: JSON.stringify({ hours: 50 })
  }).catch(() => null);

  if (!response || !response.ok) return state;
  const json = await response.json().catch(() => null);
  return json?.state || state;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  try {
    const supabase = adminClient();
    let pricingState = await ensurePricingStateRow(supabase);
    pricingState = await maybeRefreshPricingState(supabase, pricingState);

    return ok({
      ...publicConfig(),
      tossClientKey: env('TOSS_CLIENT_KEY', 'TOSS_WIDGET_CLIENT_KEY'),
      pricing: {
        multiplier: Number(pricingState.current_multiplier || 0.714),
        displayMultiplier: Number(pricingState.display_multiplier || 1),
        mode: pricingState.mode || 'auto',
        lastReason: pricingState.last_reason || null,
        lastEvaluatedAt: pricingState.last_evaluated_at || null
      }
    });
  } catch (error) {
    return fail('config 로드 실패', error.message, 500);
  }
}
