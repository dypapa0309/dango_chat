(async () => {
  const qs = new URLSearchParams(location.search);
  const token = qs.get('token');
  const statusEl = document.getElementById('joinStatus');
  const resultEl = document.getElementById('joinResult');
  const joinBtn = document.getElementById('btnJoin');
  const formBody = document.getElementById('joinFormBody');
  const contractAgreed = document.getElementById('contractAgreed');
  const commercialPlateConfirmed = document.getElementById('commercialPlateConfirmed');

  const fields = {
    name: document.getElementById('driverName'),
    phone: document.getElementById('driverPhone'),
    vehicleType: document.getElementById('vehicleType'),
    vehicleNumber: document.getElementById('vehicleNumber'),
    bankName: document.getElementById('bankName'),
    accountHolder: document.getElementById('accountHolder'),
    accountNumber: document.getElementById('accountNumber'),
    payoutNote: document.getElementById('payoutNote')
  };

  function syncButton() {
    joinBtn.disabled = !(contractAgreed.checked && commercialPlateConfirmed.checked);
  }

  contractAgreed.addEventListener('change', syncButton);
  commercialPlateConfirmed.addEventListener('change', syncButton);

  if (!token) {
    statusEl.innerHTML = '<strong>유효하지 않은 가입 링크예요.</strong><div>운영툴에서 복사한 전체 가입 링크로 다시 열어주세요.</div>';
    formBody.hidden = true;
    return;
  }

  try {
    const res = await fetch(`/.netlify/functions/driver-join?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '기사 정보를 불러오지 못했어요.');

    const driver = data.driver;
    statusEl.innerHTML = `<strong>${driver.name || '기사'}</strong><div>연락처 ${driver.phone || '-'}</div>`;
    fields.name.value = driver.name || '';
    fields.phone.value = driver.phone || '';
    fields.vehicleType.value = driver.vehicle_type || '';
    fields.vehicleNumber.value = driver.vehicle_number || '';
    fields.bankName.value = driver.bank_name || '';
    fields.accountHolder.value = driver.account_holder || '';
    fields.accountNumber.value = driver.account_number || '';
    fields.payoutNote.value = driver.payout_note || '';

    if (driver.consign_contract_agreed && driver.commercial_plate_confirmed) {
      contractAgreed.checked = true;
      commercialPlateConfirmed.checked = true;
      joinBtn.disabled = false;
      resultEl.textContent = '이미 가입과 계약 동의가 끝난 기사예요. 필요하면 정보를 다시 저장할 수 있어요.';
    }
  } catch (error) {
    statusEl.innerHTML = `<strong>${error.message || '기사 정보를 불러오지 못했어요.'}</strong><div>가입 링크가 만료됐거나 잘못됐을 수 있어요. 운영툴에서 링크를 다시 복사해주세요.</div>`;
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
      commercialPlateConfirmed: commercialPlateConfirmed.checked,
      contractAgreed: contractAgreed.checked
    };

    const res = await fetch('/.netlify/functions/driver-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      resultEl.textContent = data.error || '기사 가입 저장에 실패했어요.';
      joinBtn.disabled = false;
      joinBtn.textContent = '가입 완료';
      return;
    }

    resultEl.textContent = '기사 가입과 계약 동의가 저장됐어요. 이제 배차 요청 링크에서 수락하거나 거절할 수 있어요.';
    joinBtn.textContent = '가입 완료';
    joinBtn.disabled = false;
  };
})();
