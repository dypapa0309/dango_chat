import { adminClient } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { resolveDriver } from '../../shared/driver-auth.js';

const CONTRACT_VERSION = '2026-03-21-v1';
const VEHICLE_SERVICES = ['move', 'yd', 'waste', 'install', 'interior', 'interior_help'];

async function loadDriverByToken(supabase, token) {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, name, phone, vehicle_type, vehicle_note, vehicle_number, bank_name, account_number, account_holder, payout_enabled, payout_note, dispatch_enabled, status, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, join_token, tax_name, tax_birth_date, tax_id_number, tax_email, tax_address, tax_withholding_type, tax_withholding_agreed, supports_move, supports_clean, supports_yd, supported_services')
    .eq('join_token', token)
    .single();
  if (error) throw error;
  return data;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;

  try {
    const supabase = adminClient();

    if (event.httpMethod === 'GET') {
      const token = event?.queryStringParameters?.token;
      // Bearer 세션 우선, 없으면 레거시 token
      const resolved = await resolveDriver(event, token || null);
      if (!resolved) return fail('로그인이 필요하거나 유효하지 않은 토큰입니다.', null, 401);
      return ok({ driver: resolved.driver, contractVersion: CONTRACT_VERSION });
    }

    if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

    const {
      token,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      bankName,
      accountNumber,
      accountHolder,
      payoutNote,
      taxName,
      taxBirthDate,
      taxIdNumber,
      taxEmail,
      taxAddress,
      supportsMove,
      supportsClean,
      supportsYd,
      supportedServices,
      commercialPlateConfirmed,
      contractAgreed,
      taxWithholdingAgreed
    } = parseBody(event);

    if (!contractAgreed) return fail('위탁운송 계약 동의가 필요합니다.');
    if (!taxWithholdingAgreed) return fail('3.3% 세금 정산 동의가 필요합니다.');
    if (!(taxName || '').trim()) return fail('세금 신고용 이름을 입력해주세요.');
    if (!(taxBirthDate || '').trim()) return fail('생년월일을 입력해주세요.');
    if (!(taxIdNumber || '').trim()) return fail('세금 식별번호를 입력해주세요.');
    if (!(taxAddress || '').trim()) return fail('세금 신고용 주소를 입력해주세요.');

    const normalizedServices = Array.isArray(supportedServices)
      ? supportedServices.filter(Boolean)
      : [
          supportsMove ? 'move' : null,
          supportsClean ? 'clean' : null,
          supportsYd ? 'yd' : null
        ].filter(Boolean);
    if (!normalizedServices.length) return fail('가능 서비스는 하나 이상 선택해주세요.');

    const hasVehicleService = normalizedServices.some((s) => VEHICLE_SERVICES.includes(s));
    if (hasVehicleService && !commercialPlateConfirmed) return fail('영업용 차량 기준과 자격 요건 확인이 필요합니다.');

    const resolved = await resolveDriver(event, token || null);
    if (!resolved) return fail('로그인이 필요하거나 유효하지 않은 토큰입니다.', null, 401);
    const driver = resolved.driver;

    const { data, error } = await supabase
      .from('drivers')
      .update({
        name: (name || driver.name || '').trim(),
        phone: (phone || driver.phone || '').trim(),
        vehicle_type: (vehicleType || driver.vehicle_type || '').trim() || null,
        vehicle_number: (vehicleNumber || '').trim() || null,
        bank_name: (bankName || '').trim() || null,
        account_number: (accountNumber || '').trim() || null,
        account_holder: (accountHolder || '').trim() || null,
        payout_note: (payoutNote || '').trim() || null,
        tax_name: (taxName || '').trim() || null,
        tax_birth_date: (taxBirthDate || '').trim() || null,
        tax_id_number: (taxIdNumber || '').trim() || null,
        tax_email: (taxEmail || '').trim() || null,
        tax_address: (taxAddress || '').trim() || null,
        tax_withholding_type: 'freelancer_3_3',
        tax_withholding_agreed: true,
        supports_move: normalizedServices.includes('move'),
        supports_clean: normalizedServices.includes('clean'),
        supports_yd: normalizedServices.includes('yd'),
        supported_services: normalizedServices,
        commercial_plate_confirmed: hasVehicleService ? true : false,
        consign_contract_agreed: true,
        consign_contract_version: CONTRACT_VERSION,
        consign_contract_accepted_at: new Date().toISOString(),
        dispatch_enabled: true,
        updated_by: 'driver-join'
      })
      .eq('id', driver.id)
      .select('id, name, phone, vehicle_type, vehicle_number, bank_name, account_number, account_holder, commercial_plate_confirmed, consign_contract_agreed, consign_contract_version, consign_contract_accepted_at, join_token, tax_name, tax_birth_date, tax_id_number, tax_email, tax_address, tax_withholding_type, tax_withholding_agreed, supports_move, supports_clean, supports_yd, supported_services')
      .single();

    if (error) throw error;
    return ok({ driver: data, contractVersion: CONTRACT_VERSION });
  } catch (error) {
    return fail('기사 가입 처리 실패', error.message, 500);
  }
}
