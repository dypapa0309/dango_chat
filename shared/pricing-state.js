export const DEFAULT_PRICING_STATE = {
  key: 'default',
  current_multiplier: 0.714,
  display_multiplier: 1,
  mode: 'auto',
  min_multiplier: 0.62,
  max_multiplier: 0.9,
  adjust_step_small: 0.02,
  adjust_step_large: 0.04,
  last_reason: '초기값',
  last_metrics: null,
  last_evaluated_at: null
};

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

export function clampMultiplier(value, min, max) {
  return Math.max(Number(min), Math.min(Number(max), round3(value)));
}

export async function ensurePricingStateRow(supabase) {
  const { data: existing, error } = await supabase
    .from('pricing_state')
    .select('*')
    .eq('key', DEFAULT_PRICING_STATE.key)
    .maybeSingle();

  if (error) throw error;
  if (existing) return existing;

  const { data, error: insertError } = await supabase
    .from('pricing_state')
    .insert(DEFAULT_PRICING_STATE)
    .select('*')
    .single();

  if (insertError) throw insertError;
  return data;
}

export function recommendPricingAdjustment(state, metrics) {
  const currentMultiplier = Number(state?.current_multiplier || DEFAULT_PRICING_STATE.current_multiplier);
  const minMultiplier = Number(state?.min_multiplier || DEFAULT_PRICING_STATE.min_multiplier);
  const maxMultiplier = Number(state?.max_multiplier || DEFAULT_PRICING_STATE.max_multiplier);
  const smallStep = Number(state?.adjust_step_small || DEFAULT_PRICING_STATE.adjust_step_small);
  const largeStep = Number(state?.adjust_step_large || DEFAULT_PRICING_STATE.adjust_step_large);

  const spend = Number(metrics?.spend || 0);
  const sentLeads = Number(metrics?.sentLeads || 0);
  const readLeads = Number(metrics?.readLeads || 0);
  const paidOrders = Number(metrics?.paidOrders || 0);
  const paidRevenue = Number(metrics?.paidRevenue || 0);
  const companyRevenue = Number(metrics?.companyRevenue || 0);
  const effectiveLeads = readLeads > 0 ? readLeads : sentLeads;

  const paidConversionRate = effectiveLeads > 0 ? paidOrders / effectiveLeads : 0;
  const companyRoas = spend > 0 ? companyRevenue / spend : 0;
  const revenueRoas = spend > 0 ? paidRevenue / spend : 0;
  const costPerPaidOrder = paidOrders > 0 ? spend / paidOrders : spend;

  let change = 0;
  let reason = '표본이 적어서 유지';

  if (spend <= 0 || effectiveLeads < 8) {
    change = 0;
    reason = '광고비 또는 리드 표본이 적어서 유지';
  } else if (companyRoas >= 2.2 && paidConversionRate >= 0.18) {
    change = largeStep;
    reason = '광고 효율과 결제 전환이 좋아서 인상';
  } else if (companyRoas >= 1.6 && paidConversionRate >= 0.1) {
    change = smallStep;
    reason = '광고 효율이 좋아서 소폭 인상';
  } else if (companyRoas <= 0.8 && paidConversionRate <= 0.05) {
    change = -largeStep;
    reason = '광고 효율과 결제 전환이 낮아서 인하';
  } else if (companyRoas <= 1.1 || paidConversionRate <= 0.07) {
    change = -smallStep;
    reason = '광고 효율 또는 결제 전환이 낮아서 소폭 인하';
  } else {
    change = 0;
    reason = '효율이 기준 범위라 유지';
  }

  const nextMultiplier = clampMultiplier(currentMultiplier + change, minMultiplier, maxMultiplier);

  return {
    currentMultiplier,
    nextMultiplier,
    change: round3(nextMultiplier - currentMultiplier),
    reason,
    metrics: {
      spend,
      sentLeads,
      readLeads,
      effectiveLeads,
      paidOrders,
      paidRevenue,
      companyRevenue,
      paidConversionRate: round3(paidConversionRate),
      companyRoas: round3(companyRoas),
      revenueRoas: round3(revenueRoas),
      costPerPaidOrder: round3(costPerPaidOrder)
    }
  };
}
