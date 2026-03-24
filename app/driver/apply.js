(async () => {
  const VEHICLE_SERVICES = ['move', 'yd', 'waste', 'install', 'interior', 'interior_help'];

  const resultEl = document.getElementById('joinResult');
  const joinBtn = document.getElementById('btnJoin');
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

  joinBtn.onclick = async () => {
    if (!confirm('전문가 지원 정보를 접수할까요?\n운영팀 검토 후 배차 가능 여부를 안내드립니다.')) return;
    joinBtn.disabled = true;
    joinBtn.textContent = '접수하고 있어요...';

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
      commercialPlateConfirmed: needsVehicle() ? commercialPlateConfirmed.checked : false,
      contractAgreed: contractAgreed.checked,
      taxWithholdingAgreed: taxWithholdingAgreed.checked
    };

    if (!payload.supportedServices.length) {
      resultEl.textContent = '가능 서비스는 하나 이상 선택해주세요.';
      joinBtn.disabled = false;
      joinBtn.textContent = '전문가 지원하기';
      return;
    }

    if (payload.accountNumber) {
      const digits = payload.accountNumber.replace(/[-\s]/g, '');
      if (!/^\d{8,20}$/.test(digits)) {
        resultEl.textContent = '계좌번호는 숫자 8~20자리로 입력해주세요. (하이픈 제외)';
        joinBtn.disabled = false;
        joinBtn.textContent = '전문가 지원하기';
        return;
      }
    }

    const res = await fetch('/.netlify/functions/driver-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      resultEl.textContent = data.error || '전문가 지원 접수에 실패했어요.';
      joinBtn.disabled = false;
      joinBtn.textContent = '전문가 지원하기';
      return;
    }

    resultEl.textContent = data.message || '전문가 지원이 접수됐어요.';
    joinBtn.textContent = '전문가 지원하기';
    joinBtn.disabled = false;
  };
})();
