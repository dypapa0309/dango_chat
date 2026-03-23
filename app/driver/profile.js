(async () => {
  const qs = new URLSearchParams(location.search);
  const token = qs.get('token');
  const statusEl = document.getElementById('profileStatus');
  const resultEl = document.getElementById('profileResult');
  const saveBtn = document.getElementById('btnSaveProfile');
  const formBody = document.getElementById('profileFormBody');
  const contractAgreed = document.getElementById('contractAgreed');
  const commercialPlateConfirmed = document.getElementById('commercialPlateConfirmed');
  const taxWithholdingAgreed = document.getElementById('taxWithholdingAgreed');
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

  function syncButton() {
    const hasService = getSelectedServices().length > 0;
    saveBtn.disabled = !(contractAgreed.checked && commercialPlateConfirmed.checked && taxWithholdingAgreed.checked && hasService);
  }

  [contractAgreed, commercialPlateConfirmed, taxWithholdingAgreed].forEach((input) => {
    input.addEventListener('change', syncButton);
  });
  serviceInputs.forEach((input) => input.addEventListener('change', syncButton));

  if (!token) {
    statusEl.innerHTML = '<strong>유효하지 않은 정보 관리 링크입니다.</strong><div>운영팀이 보낸 개인별 서비스 관리 링크를 다시 열어주세요.</div>';
    formBody.hidden = true;
    return;
  }

  try {
    const res = await fetch(`/.netlify/functions/driver-join?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '기사 정보를 불러오지 못했어요.');

    const driver = data.driver;
    statusEl.innerHTML = `<strong>${driver.name || '기사님'}</strong><div>가능 서비스와 정산 정보를 직접 바꿀 수 있어요.</div>`;
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

    contractAgreed.checked = !!driver.consign_contract_agreed;
    commercialPlateConfirmed.checked = !!driver.commercial_plate_confirmed;
    taxWithholdingAgreed.checked = !!driver.tax_withholding_agreed;
    syncButton();
    resultEl.textContent = '가능 서비스와 정산 정보를 바꾼 뒤 저장할 수 있어요.';
  } catch (error) {
    statusEl.innerHTML = `<strong>${error.message || '기사 정보를 불러오지 못했어요.'}</strong><div>링크가 만료됐거나 잘못됐을 수 있어요. 운영팀에 다시 요청해주세요.</div>`;
    formBody.hidden = true;
    return;
  }

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = '저장하고 있어요...';

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
      commercialPlateConfirmed: commercialPlateConfirmed.checked,
      contractAgreed: contractAgreed.checked,
      taxWithholdingAgreed: taxWithholdingAgreed.checked
    };

    if (!payload.supportedServices.length) {
      resultEl.textContent = '가능 서비스는 하나 이상 선택해주세요.';
      saveBtn.disabled = false;
      saveBtn.textContent = '정보 저장';
      return;
    }

    const res = await fetch('/.netlify/functions/driver-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      resultEl.textContent = data.error || '기사 정보 저장에 실패했어요.';
      saveBtn.disabled = false;
      saveBtn.textContent = '정보 저장';
      return;
    }

    resultEl.textContent = '서비스와 정산 정보를 저장했어요.';
    saveBtn.textContent = '정보 저장';
    saveBtn.disabled = false;
  };
})();
