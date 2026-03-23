(async () => {
  const HELPER_CUSTOMER_FEE = 60000;
  const HELPER_DRIVER_FEE = 40000;
  const LADDER_CUSTOMER_FEE = 120000;
  const LADDER_DRIVER_FEE = 100000;
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

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>\"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  }

  function summarizeCountMap(obj = {}) {
    const entries = Object.entries(obj || {}).filter(([, value]) => Number(value || 0) > 0);
    if (!entries.length) return '선택 없음';
    return entries.map(([key, value]) => `${escapeHtml(key)} ${Number(value)}개`).join(', ');
  }

  function formatMoveType(moveType) {
    const map = { normal: '일반이사', half: '반포장이사', storage: '보관이사' };
    return map[moveType] || moveType || '-';
  }

  function formatLoadLevel(loadLevel) {
    const map = {
      0: '짐 거의 없음',
      1: '가벼운 편',
      2: '보통',
      3: '많은 편',
      4: '매우 많음'
    };
    return map[String(loadLevel ?? '')] || '-';
  }

  function renderSpecialRequestTags(option = {}) {
    const tags = [];
    if (option.helperFrom) tags.push(`<span class="option-tag helper">출발지 인부 고객 ${HELPER_CUSTOMER_FEE.toLocaleString()}원 / 기사 ${HELPER_DRIVER_FEE.toLocaleString()}원</span>`);
    if (option.helperTo) tags.push(`<span class="option-tag helper">도착지 인부 고객 ${HELPER_CUSTOMER_FEE.toLocaleString()}원 / 기사 ${HELPER_DRIVER_FEE.toLocaleString()}원</span>`);
    if (option.ladderFrom) tags.push(`<span class="option-tag ladder">출발지 사다리차 고객 ${LADDER_CUSTOMER_FEE.toLocaleString()}원 / 기사 ${LADDER_DRIVER_FEE.toLocaleString()}원</span>`);
    if (option.ladderTo) tags.push(`<span class="option-tag ladder">도착지 사다리차 고객 ${LADDER_CUSTOMER_FEE.toLocaleString()}원 / 기사 ${LADDER_DRIVER_FEE.toLocaleString()}원</span>`);
    if (option.waypointLadder) tags.push(`<span class="option-tag ladder">경유지 사다리차 고객 ${LADDER_CUSTOMER_FEE.toLocaleString()}원 / 기사 ${LADDER_DRIVER_FEE.toLocaleString()}원</span>`);
    return tags.length ? `<div class="option-tags">${tags.join('')}</div>` : '';
  }

  function renderJobSummary(job) {
    const item = job.item_summary || {};
    const option = job.option_summary || {};
    return `
      <div class="job-grid">
        <div class="info-block">
          <strong>기본 정보</strong>
          <div>날짜: ${escapeHtml(job.move_date || '-')}</div>
          <div>출발: ${escapeHtml(job.start_address || '-')}</div>
          <div>도착: ${escapeHtml(job.end_address || '-')}</div>
          <div>경유지: ${escapeHtml(job.via_address || '없음')}</div>
        </div>
        <div class="info-block">
          <strong>기사 기준 운임</strong>
          <div>총 결제: ${Number(job.total_price || 0).toLocaleString()}원</div>
          <div>기사 정산 예정: ${Number(job.driver_amount || 0).toLocaleString()}원</div>
          <div>당고 수수료: ${Number(job.company_amount || 0).toLocaleString()}원</div>
        </div>
      </div>
      <div class="job-grid" style="margin-top:12px;">
        <div class="info-block">
          <strong>신청 요약</strong>
          <div>차량: ${escapeHtml(item.vehicle || '-')}</div>
          <div>이사 방식: ${escapeHtml(formatMoveType(item.moveType))}</div>
          <div>짐양: ${escapeHtml(formatLoadLevel(item.loadLevel))}</div>
          <div>동승: ${Number(item.ride || 0)}명</div>
          <div>거리: ${job.distance_km != null ? `${Number(job.distance_km || 0).toFixed(1)}km` : '미기록'}</div>
        </div>
        <div class="info-block">
          <strong>옵션</strong>
          <div>${
            [
              option.helper ? '기사 도움' : null,
              option.packing ? '반포장' : null,
              option.cleaning ? '청소 연계' : null,
              option.via_stop ? '경유지 있음' : null,
              option.ladderFrom ? '출발지 사다리차' : null,
              option.ladderTo ? '도착지 사다리차' : null,
              option.waypointLadder ? '경유지 사다리차' : null,
              option.cantCarryFrom ? '출발지 직접나르기 어려움' : null,
              option.cantCarryTo ? '도착지 직접나르기 어려움' : null
            ].filter(Boolean).join(', ') || '선택 없음'
          }</div>
          ${renderSpecialRequestTags(option)}
        </div>
      </div>
      <div class="info-block" style="margin-top:12px;">
        <strong>가구 · 가전</strong>
        <div>${summarizeCountMap(item.items)}</div>
      </div>
      ${
        item.waypointItems && Object.keys(item.waypointItems).length
          ? `<div class="info-block" style="margin-top:12px;"><strong>경유지 짐</strong><div>${summarizeCountMap(item.waypointItems)}</div></div>`
          : ''
      }
      ${
        (item.throwFrom && Object.keys(item.throwFrom).length) || (item.throwTo && Object.keys(item.throwTo).length)
          ? `<div class="info-block" style="margin-top:12px;"><strong>버릴 물건</strong><div>출발지: ${summarizeCountMap(item.throwFrom)}</div><div>도착지: ${summarizeCountMap(item.throwTo)}</div></div>`
          : ''
      }
      ${
        job.customer_note
          ? `<div class="info-block" style="margin-top:12px;"><strong>고객 메모</strong><div>${escapeHtml(job.customer_note).replace(/\n/g, '<br />')}</div></div>`
          : ''
      }
    `;
  }

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
    info.innerHTML = renderJobSummary(job);

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
