(async () => {
  const qs = new URLSearchParams(location.search);
  const token = qs.get('token');
  const info = document.getElementById('jobInfo');
  const agreementGate = document.getElementById('agreementGate');
  const progressPanel = document.getElementById('progressPanel');
  const progressText = document.getElementById('progressText');
  const result = document.getElementById('result');
  const note = document.getElementById('responseNote');
  const acceptBtn = document.getElementById('btnAccept');
  const declineBtn = document.getElementById('btnDecline');
  const departBtn = document.getElementById('btnDepart');
  const arriveBtn = document.getElementById('btnArrive');
  const startBtn = document.getElementById('btnStart');
  const requestCompleteBtn = document.getElementById('btnRequestComplete');

  function disablePrimary(disabled) {
    acceptBtn.disabled = declineBtn.disabled = disabled;
  }

  function disableProgress(disabled) {
    departBtn.disabled = arriveBtn.disabled = startBtn.disabled = requestCompleteBtn.disabled = disabled;
  }

  function renderProgress(progress) {
    if (!progress) {
      progressPanel.hidden = true;
      return;
    }
    progressPanel.hidden = false;
    progressText.textContent = `주문 ${progress.status || '-'} / 배차 ${progress.dispatchStatus || '-'}`;
    departBtn.hidden = !progress.canDepart;
    arriveBtn.hidden = !progress.canArrive;
    startBtn.hidden = !progress.canStart;
    requestCompleteBtn.hidden = !progress.canRequestComplete;
  }

  async function loadAssignment() {
    if (!token) {
      info.textContent = '유효하지 않은 접근입니다.';
      disablePrimary(true);
      disableProgress(true);
      return null;
    }

    const res = await fetch(`/.netlify/functions/driver-respond?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!data.success) {
      info.textContent = data.error || '정보 불러오기 실패';
      disablePrimary(true);
      disableProgress(true);
      return null;
    }

    if (data.expired || data.handled) {
      info.innerHTML = `<div><strong>상태:</strong> ${data.message}</div><div><strong>출발:</strong> ${data.job?.start_address || '-'}</div><div><strong>도착:</strong> ${data.job?.end_address || '-'}</div>`;
      disablePrimary(true);
      disableProgress(true);
      return data;
    }

    const job = data.job || {};
    info.innerHTML = `<div><strong>날짜:</strong> ${job.move_date || '-'}</div><div><strong>출발:</strong> ${job.start_address || '-'}</div><div><strong>도착:</strong> ${job.end_address || '-'}</div><div><strong>운임:</strong> ${Number(job.total_price || 0).toLocaleString()}원</div>`;

    if (data.agreementRequired) {
      agreementGate.hidden = false;
      agreementGate.innerHTML = `
        <div><strong>먼저 기사 가입과 위탁운송 계약 동의가 필요해요.</strong></div>
        <div style="margin-top:8px;">영업용 차량 기준 확인과 계약 동의가 끝나야 배차 응답을 할 수 있어요.</div>
        ${data.joinUrl ? `<a class="btn primary link-btn" href="${data.joinUrl}">기사 가입하고 계약 동의하기</a>` : ''}
      `;
      disablePrimary(true);
      disableProgress(true);
      note.disabled = true;
      return data;
    }

    if (data.accepted) {
      disablePrimary(true);
      renderProgress(data.progress);
    } else {
      disablePrimary(false);
      progressPanel.hidden = true;
    }

    return data;
  }

  async function respond(action) {
    disablePrimary(true);
    disableProgress(true);
    result.textContent = '처리 중...';
    const res = await fetch('/.netlify/functions/driver-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, responseNote: note.value.trim() })
    });
    const data = await res.json();
    if (!data.success) {
      result.textContent = data.error || '처리 실패';
      await loadAssignment();
      return;
    }
    result.textContent = data.message || '처리되었습니다.';
    await loadAssignment();
    disableProgress(false);
  }

  acceptBtn.onclick = () => respond('accept');
  declineBtn.onclick = () => respond('decline');
  departBtn.onclick = () => respond('depart');
  arriveBtn.onclick = () => respond('arrive');
  startBtn.onclick = () => respond('start');
  requestCompleteBtn.onclick = () => respond('request_complete');

  await loadAssignment();
})();
