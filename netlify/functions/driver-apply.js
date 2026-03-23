import { adminClient } from '../../shared/db.js';
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
    if (!commercialPlateConfirmed) return fail('영업용 차량 기준 확인이 필요합니다.');
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
      commercial_plate_confirmed: true,
      consign_contract_agreed: true,
      consign_contract_version: CONTRACT_VERSION,
      consign_contract_accepted_at: new Date().toISOString(),
      dispatch_enabled: false,
      payout_enabled: false,
      supports_move: normalizedServices.includes('move'),
      supports_clean: normalizedServices.includes('clean'),
      supports_yd: normalizedServices.includes('yd'),
      supported_services: normalizedServices,
      status: existing?.status === 'active' ? 'active' : 'pending_review'
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
      message: data.status === 'active'
        ? '이미 등록된 기사 정보로 다시 저장됐어요. 운영팀 확인 후 배차를 이어갑니다.'
        : '기사 가입이 접수됐어요. 운영팀이 확인 후 배차 가능 상태를 안내드립니다.'
    });
  } catch (error) {
    return fail('기사 가입 접수 실패', error.message, 500);
  }
}
