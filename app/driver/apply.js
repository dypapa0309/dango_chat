(async () => {
  const resultEl = document.getElementById('joinResult');
  const joinBtn = document.getElementById('btnJoin');
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
    joinBtn.disabled = !(contractAgreed.checked && commercialPlateConfirmed.checked && taxWithholdingAgreed.checked && hasService);
  }

  contractAgreed.addEventListener('change', syncButton);
  commercialPlateConfirmed.addEventListener('change', syncButton);
  taxWithholdingAgreed.addEventListener('change', syncButton);
  serviceInputs.forEach((input) => input.addEventListener('change', syncButton));

  joinBtn.onclick = async () => {
    joinBtn.disabled = true;
    joinBtn.textContent = '접수하고 있습니다...';

    const payload = {
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
      joinBtn.disabled = false;
      joinBtn.textContent = '지원 접수';
      return;
    }

    const res = await fetch('/.netlify/functions/driver-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      resultEl.textContent = data.error || '기사 지원 접수에 실패했습니다.';
      joinBtn.disabled = false;
      joinBtn.textContent = '지원 접수';
      return;
    }

    resultEl.textContent = data.message || '기사 지원이 접수됐습니다.';
    joinBtn.textContent = '지원 접수';
    joinBtn.disabled = false;
  };
})();
