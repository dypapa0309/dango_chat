import { createClient } from '@supabase/supabase-js';
import { adminClient, publicConfig } from '../../shared/db.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

const CONTRACT_VERSION = '2026-03-21-v1';

function normalizePhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function normalizeAccountNumber(value) {
  return String(value || '').replace(/[^0-9-]/g, '');
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const {
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

    if (!(name || '').trim()) return fail('이름을 입력해주세요.');
    if (!normalizePhone(phone)) return fail('연락처를 입력해주세요.');
    if (!contractAgreed) return fail('위탁운송 계약 동의가 필요합니다.');
    if (!taxWithholdingAgreed) return fail('3.3% 세금 정산 동의가 필요합니다.');

    const VEHICLE_SERVICES = ['move', 'yd', 'waste', 'install', 'interior', 'interior_help'];
    const normalizedServicesEarly = Array.isArray(supportedServices)
      ? supportedServices.filter(Boolean)
      : [supportsMove ? 'move' : null, supportsClean ? 'clean' : null, supportsYd ? 'yd' : null].filter(Boolean);
    const needsVehicle = normalizedServicesEarly.some((s) => VEHICLE_SERVICES.includes(s));
    if (needsVehicle && !commercialPlateConfirmed) return fail('영업용 차량 기준 확인이 필요합니다.');
    if (!(taxName || '').trim()) return fail('세금 신고용 이름을 입력해주세요.');
    if (!(taxBirthDate || '').trim()) return fail('생년월일을 입력해주세요.');
    if (!(taxIdNumber || '').trim()) return fail('세금 식별번호를 입력해주세요.');
    if (!(taxAddress || '').trim()) return fail('세금 신고용 주소를 입력해주세요.');

    const normalizedServices = normalizedServicesEarly;
    if (!normalizedServices.length) return fail('가능 서비스는 하나 이상 선택해주세요.');

    // 세션에서 user_id 추출 (로그인된 전문가 지원 시 자동 연결)
    let authUserId = null;
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken) {
      try {
        const { supabaseUrl, supabaseAnonKey } = publicConfig();
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data: { user } } = await userClient.auth.getUser(bearerToken);
        if (user?.id) authUserId = user.id;
      } catch {}
    }

    const supabase = adminClient();
    const phoneValue = normalizePhone(phone);
    const { data: existing } = await supabase
      .from('drivers')
      .select('id, status')
      .eq('phone', phoneValue)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      name: (name || '').trim(),
      phone: phoneValue,
      vehicle_type: (vehicleType || '').trim() || null,
      vehicle_number: (vehicleNumber || '').trim() || null,
      bank_name: (bankName || '').trim() || null,
      account_number: normalizeAccountNumber(accountNumber) || null,
      account_holder: (accountHolder || '').trim() || null,
      payout_note: (payoutNote || '').trim() || null,
      tax_name: (taxName || '').trim() || null,
      tax_birth_date: (taxBirthDate || '').trim() || null,
      tax_id_number: (taxIdNumber || '').trim() || null,
      tax_email: (taxEmail || '').trim() || null,
      tax_address: (taxAddress || '').trim() || null,
      tax_withholding_type: 'freelancer_3_3',
      tax_withholding_agreed: true,
      commercial_plate_confirmed: needsVehicle ? true : false,
      consign_contract_agreed: true,
      consign_contract_version: CONTRACT_VERSION,
      consign_contract_accepted_at: new Date().toISOString(),
      dispatch_enabled: true,
      payout_enabled: false,
      supports_move: normalizedServices.includes('move'),
      supports_clean: normalizedServices.includes('clean'),
      supports_yd: normalizedServices.includes('yd'),
      supported_services: normalizedServices,
      status: 'active',
      ...(authUserId ? { user_id: authUserId } : {})
    };

    let data;
    let error;
    if (existing?.id) {
      ({ data, error } = await supabase
        .from('drivers')
        .update(payload)
        .eq('id', existing.id)
        .select('id, name, phone, join_token, status')
        .single());
    } else {
      ({ data, error } = await supabase
        .from('drivers')
        .insert([payload])
        .select('id, name, phone, join_token, status')
        .single());
    }

    if (error && /column .* does not exist/i.test(error.message || '')) {
      const fallbackMemo = [
        payoutNote ? `정산 메모: ${payoutNote}` : null,
        vehicleNumber ? `차량 번호: ${vehicleNumber}` : null,
        `세금 이름: ${(taxName || '').trim()}`,
        `생년월일: ${(taxBirthDate || '').trim()}`,
        `세금 식별번호: ${(taxIdNumber || '').trim()}`,
        taxEmail ? `세금 이메일: ${taxEmail}` : null,
        `세금 주소: ${(taxAddress || '').trim()}`,
        `가능 서비스: ${normalizedServices.join(', ') || '미선택'}`,
        '3.3% 세금 정산 동의: 예',
        '영업용 차량 기준 확인: 예',
        `계약 동의 버전: ${CONTRACT_VERSION}`
      ].filter(Boolean).join('\n');

      const fallbackPayload = {
        name: (name || '').trim(),
        phone: phoneValue,
        vehicle_type: (vehicleType || '').trim() || null,
        vehicle_note: (vehicleNumber || '').trim() || null,
        bank_name: (bankName || '').trim() || null,
        bank_account: normalizeAccountNumber(accountNumber) || null,
        account_holder: (accountHolder || '').trim() || null,
        internal_memo: fallbackMemo,
        dispatch_enabled: false,
        status: existing?.status === 'active' ? 'active' : 'pending_review'
      };

      if (existing?.id) {
        ({ data, error } = await supabase
          .from('drivers')
          .update(fallbackPayload)
          .eq('id', existing.id)
          .select('id, name, phone, status')
          .single());
      } else {
        ({ data, error } = await supabase
          .from('drivers')
          .insert([fallbackPayload])
          .select('id, name, phone, status')
          .single());
      }
    }

    if (error) throw error;
    return ok({
      driver: data,
      message: '전문가 가입이 완료됐어요. 지금 바로 배차를 받을 수 있어요.'
    });
  } catch (error) {
    return fail('기사 가입 접수 실패', error.message, 500);
  }
}
