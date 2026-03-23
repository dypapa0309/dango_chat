import { adminClient } from '../../shared/db.js';
import { ok, fail, handleOptions } from '../../shared/http.js';
import { requireAdmin } from '../../shared/admin-auth.js';

async function selectDrivers(supabase, columns) {
  return supabase
    .from('drivers')
    .select(columns.join(', '))
    .order('created_at', { ascending: false });
}

function normalizeDriver(driver = {}) {
  const supportedServices = Array.isArray(driver.supported_services)
    ? driver.supported_services.filter(Boolean)
    : [
        driver.supports_move !== false ? 'move' : null,
        driver.supports_clean ? 'clean' : null,
        driver.supports_yd ? 'yd' : null
      ].filter(Boolean);
  return {
    supports_move: false,
    supports_clean: false,
    supports_yd: false,
    supported_services: supportedServices.length ? supportedServices : ['move'],
    tax_withholding_agreed: false,
    tax_withholding_type: 'freelancer_3_3',
    ...driver
  };
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  const denied = requireAdmin(event);
  if (denied) return denied;

  try {
    const supabase = adminClient();
    const fullColumns = [
      'id', 'name', 'phone', 'status', 'dispatch_enabled', 'completed_jobs', 'rating', 'acceptance_rate',
      'response_score', 'bank_name', 'account_number', 'account_holder', 'payout_enabled', 'payout_note',
      'join_token', 'vehicle_type', 'vehicle_number', 'commercial_plate_confirmed', 'consign_contract_agreed',
      'consign_contract_version', 'consign_contract_accepted_at', 'internal_memo', 'tax_name', 'tax_birth_date',
      'tax_id_number', 'tax_email', 'tax_address', 'tax_withholding_type', 'tax_withholding_agreed',
      'supports_move', 'supports_clean', 'supports_yd', 'supported_services', 'created_at'
    ];
    const fallbackColumns = [
      'id', 'name', 'phone', 'status', 'dispatch_enabled', 'completed_jobs', 'rating', 'acceptance_rate',
      'response_score', 'bank_name', 'account_number', 'account_holder', 'payout_enabled', 'payout_note',
      'join_token', 'vehicle_type', 'vehicle_number', 'commercial_plate_confirmed', 'consign_contract_agreed',
      'internal_memo', 'created_at'
    ];

    let result = await selectDrivers(supabase, fullColumns);
    if (result.error && /column .* does not exist/i.test(result.error.message || '')) {
      result = await selectDrivers(supabase, fallbackColumns);
    }

    if (result.error) throw result.error;
    return ok({ drivers: (result.data || []).map(normalizeDriver) });
  } catch (error) {
    return fail('기사 목록 조회 실패', error.message, 500);
  }
}
