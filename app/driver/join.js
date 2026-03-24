(async () => {
  const VEHICLE_SERVICES = ['move', 'yd', 'waste', 'install', 'interior', 'interior_help'];

  const qs = new URLSearchParams(location.search);
  const token = qs.get('token');
  const statusEl = document.getElementById('joinStatus');
  const resultEl = document.getElementById('joinResult');
  const joinBtn = document.getElementById('btnJoin');
  const formBody = document.getElementById('joinFormBody');
  const contractAgreed = document.getElementById('contractAgreed');
  const commercialPlateConfirmed = document.getElementById('commercialPlateConfirmed');
  const taxWithholdingAgreed = document.getElementById('taxWithholdingAgreed');
  const vehicleSection = document.getElementById('vehicleSection');
  const vehiclePlateSection = document.getElementById('vehiclePlateSection');
  const serviceInputs = [...document.querySelectorAll('[data-service-option]')];

  const fields = {
    name: document.getElementById('driverName'),
    phone: document.getElementById('driverPhone'),
    vehicleType: document.getElementById('vehicleType'),
    vehicleNumber: document.getElementById('vehicleNumber'),
    bankName: document.getElementById('bankName'),
    accountHolder: document.getElementById('accountHolder'),
    accountNumber: document.getElementById('accountNumber'),
    payoutNote: document.getElementById('payoutNote'),
    taxName: document.getElementById('taxName'),
    taxBirthDate: document.getElementById('taxBirthDate'),
    taxIdNumber: document.getElementById('taxIdNumber'),
    taxEmail: document.getElementById('taxEmail'),
    taxAddress: document.getElementById('taxAddress')
  };

  const getSelectedServices = () => serviceInputs.filter((input) => input.checked).map((input) => input.value);
  const needsVehicle = () => getSelectedServices().some((s) => VEHICLE_SERVICES.includes(s));

  function updateVehicleSection() {
    const vehicle = needsVehicle();
    vehicleSection.hidden = !vehicle;
    vehiclePlateSection.hidden = !vehicle;
    if (!vehicle) {
      commercialPlateConfirmed.checked = false;
    }
  }

  function syncButton() {
    const hasService = getSelectedServices().length > 0;
    const plateOk = needsVehicle() ? commercialPlateConfirmed.checked : true;
    joinBtn.disabled = !(contractAgreed.checked && plateOk && taxWithholdingAgreed.checked && hasService);
  }

  contractAgreed.addEventListener('change', syncButton);
  commercialPlateConfirmed.addEventListener('change', syncButton);
  taxWithholdingAgreed.addEventListener('change', syncButton);
  serviceInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateVehicleSection();
      syncButton();
    });
  });

  if (!token) {
    statusEl.innerHTML = '<strong>유효하지 않은 가입 링크입니다.</strong><div>신규 전문가 지원은 공용 지원 링크를 사용하고, 기존 등록 전문가 온보딩은 운영툴에서 복사한 전체 개별 링크로 다시 열어주세요.</div>';
    formBody.hidden = true;
    return;
  }

  try {
    const res = await fetch(`/.netlify/functions/driver-join?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '전문가 정보를 불러오지 못했어요.');

    const driver = data.driver;
    statusEl.innerHTML = `<strong>${driver.name || '전문가'}</strong><div>연락처 ${driver.phone || '-'}</div>`;
    fields.name.value = driver.name || '';
    fields.phone.value = driver.phone || '';
    fields.vehicleType.value = driver.vehicle_type || '';
    fields.vehicleNumber.value = driver.vehicle_number || '';
    fields.bankName.value = driver.bank_name || '';
    fields.accountHolder.value = driver.account_holder || '';
    fields.accountNumber.value = driver.account_number || '';
    fields.payoutNote.value = driver.payout_note || '';
    fields.taxName.value = driver.tax_name || driver.name || '';
    fields.taxBirthDate.value = driver.tax_birth_date || '';
    fields.taxIdNumber.value = driver.tax_id_number || '';
    fields.taxEmail.value = driver.tax_email || '';
    fields.taxAddress.value = driver.tax_address || '';

    const supportedServices = Array.isArray(driver.supported_services) && driver.supported_services.length
      ? driver.supported_services
      : [
          driver.supports_move !== false ? 'move' : null,
          driver.supports_clean ? 'clean' : null,
          driver.supports_yd ? 'yd' : null
        ].filter(Boolean);
    serviceInputs.forEach((input) => {
      input.checked = supportedServices.includes(input.value);
    });
    updateVehicleSection();

    if (driver.consign_contract_agreed && driver.tax_withholding_agreed) {
      contractAgreed.checked = true;
      taxWithholdingAgreed.checked = true;
      if (needsVehicle() && driver.commercial_plate_confirmed) {
        commercialPlateConfirmed.checked = true;
      }
      joinBtn.disabled = false;
      resultEl.textContent = '이미 가입과 계약 동의가 끝난 전문가예요. 필요하면 정보를 다시 저장할 수 있어요.';
    }
  } catch (error) {
    statusEl.innerHTML = `<strong>${error.message || '전문가 정보를 불러오지 못했어요.'}</strong><div>가입 링크가 만료됐거나 잘못됐을 수 있어요. 운영툴에서 링크를 다시 복사해주세요.</div>`;
    formBody.hidden = true;
    return;
  }

  joinBtn.onclick = async () => {
    joinBtn.disabled = true;
    joinBtn.textContent = '저장하고 있어요...';

    const payload = {
      token,
      name: fields.name.value.trim(),
      phone: fields.phone.value.trim(),
      vehicleType: fields.vehicleType.value.trim(),
      vehicleNumber: fields.vehicleNumber.value.trim(),
      bankName: fields.bankName.value.trim(),
      accountHolder: fields.accountHolder.value.trim(),
      accountNumber: fields.accountNumber.value.trim(),
      payoutNote: fields.payoutNote.value.trim(),
      taxName: fields.taxName.value.trim(),
      taxBirthDate: fields.taxBirthDate.value,
      taxIdNumber: fields.taxIdNumber.value.trim(),
      taxEmail: fields.taxEmail.value.trim(),
      taxAddress: fields.taxAddress.value.trim(),
      supportedServices: getSelectedServices(),
      commercialPlateConfirmed: needsVehicle() ? commercialPlateConfirmed.checked : false,
      contractAgreed: contractAgreed.checked,
      taxWithholdingAgreed: taxWithholdingAgreed.checked
    };

    if (!payload.supportedServices.length) {
      resultEl.textContent = '가능 서비스는 하나 이상 선택해주세요.';
      joinBtn.disabled = false;
      joinBtn.textContent = '가입 완료';
      return;
    }

    if (payload.accountNumber) {
      const digits = payload.accountNumber.replace(/[-\s]/g, '');
      if (!/^\d{8,20}$/.test(digits)) {
        resultEl.textContent = '계좌번호는 숫자 8~20자리로 입력해주세요. (하이픈 제외)';
        joinBtn.disabled = false;
        joinBtn.textContent = '가입 완료';
        return;
      }
    }

    const res = await fetch('/.netlify/functions/driver-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      resultEl.textContent = data.error || '전문가 가입 저장에 실패했어요.';
      joinBtn.disabled = false;
      joinBtn.textContent = '가입 완료';
      return;
    }

    resultEl.textContent = '전문가 가입과 계약 동의가 저장됐어요. 이제 배차 요청 링크에서 수락하거나 거절할 수 있어요.';
    joinBtn.textContent = '가입 완료';
    joinBtn.disabled = false;
  };
})();
