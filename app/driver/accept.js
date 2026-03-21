(async () => {
  const qs = new URLSearchParams(location.search);
  const token = qs.get('token');
  const info = document.getElementById('jobInfo');
  const agreementGate = document.getElementById('agreementGate');
  const result = document.getElementById('result');
  const note = document.getElementById('responseNote');
  const acceptBtn = document.getElementById('btnAccept');
  const declineBtn = document.getElementById('btnDecline');

  if (!token) {
    info.textContent = '유효하지 않은 접근입니다.';
    acceptBtn.disabled = declineBtn.disabled = true;
    return;
  }

  const res = await fetch(`/.netlify/functions/driver-respond?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!data.success) {
    info.textContent = data.error || '정보 불러오기 실패';
    acceptBtn.disabled = declineBtn.disabled = true;
    return;
  }

  if (data.expired || data.handled) {
    info.innerHTML = `<div><strong>상태:</strong> ${data.message}</div><div><strong>출발:</strong> ${data.job?.start_address || '-'}</div><div><strong>도착:</strong> ${data.job?.end_address || '-'}</div>`;
    acceptBtn.disabled = declineBtn.disabled = true;
    return;
  }

  const job = data.job;
  info.innerHTML = `<div><strong>날짜:</strong> ${job.move_date || '-'}</div><div><strong>출발:</strong> ${job.start_address || '-'}</div><div><strong>도착:</strong> ${job.end_address || '-'}</div><div><strong>운임:</strong> ${Number(job.total_price || 0).toLocaleString()}원</div>`;

  if (data.agreementRequired) {
    agreementGate.hidden = false;
    agreementGate.innerHTML = `
      <div><strong>먼저 기사 가입과 위탁운송 계약 동의가 필요해요.</strong></div>
      <div style="margin-top:8px;">영업용 차량 기준 확인과 계약 동의가 끝나야 배차 응답을 할 수 있어요.</div>
      ${data.joinUrl ? `<a class="btn primary link-btn" href="${data.joinUrl}">기사 가입하고 계약 동의하기</a>` : ''}
    `;
    acceptBtn.disabled = true;
    declineBtn.disabled = true;
    note.disabled = true;
    return;
  }

  async function respond(action) {
    acceptBtn.disabled = declineBtn.disabled = true;
    result.textContent = '처리 중...';
    const res2 = await fetch('/.netlify/functions/driver-respond', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, responseNote: note.value.trim() })
    });
    const data2 = await res2.json();
    if (!data2.success) {
      result.textContent = data2.error || '처리 실패';
      acceptBtn.disabled = declineBtn.disabled = false;
      return;
    }
    result.textContent = data2.message || '처리되었습니다.';
  }

  acceptBtn.onclick = () => respond('accept');
  declineBtn.onclick = () => respond('decline');
})();
