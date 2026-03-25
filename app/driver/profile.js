window.dd.onSupabaseReady(async (sb) => {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.replace('/auth/login.html?role=driver'); return; }
  const accessToken = session.access_token;

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

  try {
    const res = await fetch('/.netlify/functions/driver-join', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '기사 정보를 불러오지 못했어요.');

    const driver = data.driver;
    statusEl.innerHTML = `<strong>${driver.name || '전문가님'}</strong><div>가능 서비스와 정산 정보를 직접 바꿀 수 있어요.</div>`;
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

    // Dispatch toggle
    const btnDispatchOn = document.getElementById('btnDispatchOn');
    const btnDispatchOff = document.getElementById('btnDispatchOff');
    const dispatchToggleStatus = document.getElementById('dispatchToggleStatus');

    function updateDispatchUI(enabled) {
      if (btnDispatchOn) btnDispatchOn.style.opacity = enabled ? '1' : '0.4';
      if (btnDispatchOff) btnDispatchOff.style.opacity = enabled ? '0.4' : '1';
      if (dispatchToggleStatus) {
        dispatchToggleStatus.textContent = enabled ? '현재 배차 수신 중이에요.' : '현재 배차 수신이 꺼져 있어요.';
      }
    }

    updateDispatchUI(driver.dispatch_enabled !== false);

    async function toggleDispatch(enabled) {
      if (dispatchToggleStatus) dispatchToggleStatus.textContent = '설정 변경 중...';
      if (btnDispatchOn) btnDispatchOn.disabled = true;
      if (btnDispatchOff) btnDispatchOff.disabled = true;
      try {
        const res = await fetch('/.netlify/functions/driver-toggle-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ enabled })
        });
        const data = await res.json();
        if (!data.success) {
          if (dispatchToggleStatus) dispatchToggleStatus.textContent = data.error || '설정 변경에 실패했어요.';
        } else {
          updateDispatchUI(data.dispatch_enabled);
        }
      } catch {
        if (dispatchToggleStatus) dispatchToggleStatus.textContent = '설정 변경 중 오류가 발생했어요.';
      } finally {
        if (btnDispatchOn) btnDispatchOn.disabled = false;
        if (btnDispatchOff) btnDispatchOff.disabled = false;
      }
    }

    if (btnDispatchOn) btnDispatchOn.onclick = () => toggleDispatch(true);
    if (btnDispatchOff) btnDispatchOff.onclick = () => toggleDispatch(false);

    // Availability calendar
    const calendarEl = document.getElementById('availabilityCalendar');
    const btnSaveAvail = document.getElementById('btnSaveAvailability');
    const availStatusEl = document.getElementById('availabilityStatus');
    const unavailableDates = new Set();

    async function loadAvailability() {
      if (!calendarEl) return;
      const today = new Date();
      const from = today.toISOString().slice(0, 10);
      const toDate = new Date(today); toDate.setDate(today.getDate() + 41);
      const to = toDate.toISOString().slice(0, 10);
      try {
        const res = await fetch(`/.netlify/functions/driver-availability?from=${from}&to=${to}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (data.success) {
          unavailableDates.clear();
          (data.availability || []).forEach((row) => { if (!row.is_available) unavailableDates.add(row.date); });
        }
      } catch {}
      renderCalendar(today);
    }

    function renderCalendar(today) {
      if (!calendarEl) return;
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      let html = days.map((d) => `<div style="text-align:center;font-size:11px;color:#888;padding:4px 0;">${d}</div>`).join('');
      const startDay = new Date(today); startDay.setDate(today.getDate() - today.getDay());
      for (let i = 0; i < 42; i++) {
        const d = new Date(startDay); d.setDate(startDay.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const isPast = d < today && d.toDateString() !== today.toDateString();
        const isUnavail = unavailableDates.has(dateStr);
        const style = isPast
          ? 'color:#ccc;cursor:default;'
          : isUnavail
            ? 'background:#fee2e2;color:#991b1b;font-weight:700;cursor:pointer;border-radius:6px;'
            : 'background:#f0fdf4;color:#166534;cursor:pointer;border-radius:6px;';
        html += `<div data-avail-date="${dateStr}" style="text-align:center;padding:6px 2px;font-size:13px;${style}">${d.getDate()}</div>`;
      }
      calendarEl.innerHTML = html;
      calendarEl.querySelectorAll('[data-avail-date]').forEach((cell) => {
        const d = new Date(cell.dataset.availDate);
        if (d < today && d.toDateString() !== today.toDateString()) return;
        cell.addEventListener('click', () => {
          const dateStr = cell.dataset.availDate;
          if (unavailableDates.has(dateStr)) { unavailableDates.delete(dateStr); } else { unavailableDates.add(dateStr); }
          if (btnSaveAvail) btnSaveAvail.disabled = false;
          renderCalendar(today);
        });
      });
    }

    if (btnSaveAvail) {
      btnSaveAvail.onclick = async () => {
        btnSaveAvail.disabled = true;
        if (availStatusEl) availStatusEl.textContent = '저장 중...';
        const today = new Date();
        const toDate = new Date(today); toDate.setDate(today.getDate() + 41);
        const dates = [];
        for (let d = new Date(today); d <= toDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().slice(0, 10);
          dates.push({ date: dateStr, is_available: !unavailableDates.has(dateStr) });
        }
        try {
          const res = await fetch('/.netlify/functions/driver-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ dates })
          });
          const data = await res.json();
          if (availStatusEl) availStatusEl.textContent = data.success ? '일정을 저장했어요.' : (data.error || '저장 실패');
        } catch {
          if (availStatusEl) availStatusEl.textContent = '저장 중 오류가 발생했어요.';
        } finally {
          btnSaveAvail.disabled = false;
        }
      };
    }

    await loadAvailability();

    // dirty tracking
    const origValues = {};
    Object.entries(fields).forEach(([key, el]) => { if (el) origValues[key] = el.value; });
    const origServices = new Set(getSelectedServices());

    function updateDirty() {
      Object.entries(fields).forEach(([key, el]) => {
        if (el) el.classList.toggle('is-dirty', el.value !== origValues[key]);
      });
    }

    Object.values(fields).forEach((el) => {
      if (el) el.addEventListener('input', updateDirty);
    });
    serviceInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const cur = new Set(getSelectedServices());
        const changed = cur.size !== origServices.size || [...cur].some((v) => !origServices.has(v));
        document.querySelectorAll('.service-chip-grid').forEach((grid) => {
          grid.classList.toggle('is-dirty', changed);
        });
      });
    });
  } catch (error) {
    statusEl.innerHTML = `<strong>${error.message || '기사 정보를 불러오지 못했어요.'}</strong><div>다시 시도해주세요.</div>`;
    formBody.hidden = true;
    return;
  }

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = '저장하고 있어요...';

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
      saveBtn.disabled = false;
      saveBtn.textContent = '정보 저장';
      return;
    }

    const res = await fetch('/.netlify/functions/driver-join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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
    Object.entries(fields).forEach(([key, el]) => { if (el) { origValues[key] = el.value; el.classList.remove('is-dirty'); } });
    origServices.clear(); getSelectedServices().forEach((v) => origServices.add(v));
    document.querySelectorAll('.service-chip-grid').forEach((grid) => grid.classList.remove('is-dirty'));
  };
});
