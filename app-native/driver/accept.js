// accept.js — ?jobId= (Bearer 세션) 또는 ?token= (SMS 레거시) 양쪽 지원
async function initAccept() {
  const HELPER_CUSTOMER_FEE = 60000;
  const HELPER_DRIVER_FEE = 40000;
  const LADDER_CUSTOMER_FEE = 120000;
  const LADDER_DRIVER_FEE = 100000;
  const qs = new URLSearchParams(location.search);
  const token = qs.get('token');
  const jobId = qs.get('jobId');

  // Bearer 토큰 (세션 방식)
  let accessToken = null;
  if (jobId && window.dd?.supabase) {
    const { data: { session } } = await window.dd.supabase.auth.getSession();
    if (!session) { location.replace(`/auth/login.html?role=driver&next=${encodeURIComponent(location.href)}`); return; }
    accessToken = session.access_token;
  }
  const info = document.getElementById('jobInfo');
  const expiryCountdown = document.getElementById('expiryCountdown');
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
          <div>거리: ${job.distance_km != null ? `${Number(job.distance_km || 0).toFixed(1)}km` : '미기록'}</div>
        </div>
      </div>
      <div class="job-grid" style="margin-top:12px;">
        <div class="info-block">
          <strong>신청 요약</strong>
          <div>차량: ${escapeHtml(item.vehicle || '-')}</div>
          <div>이사 방식: ${escapeHtml(formatMoveType(item.moveType))}</div>
          <div>짐양: ${escapeHtml(formatLoadLevel(item.loadLevel))}</div>
          <div>동승: ${Number(item.ride || 0)}명</div>
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

  const JOB_STATUS_LABEL = { draft: '임시저장', deposit_pending: '결제대기', confirmed: '결제완료', assigned: '기사배정', in_progress: '작업중', completed: '완료', canceled: '취소됨' };
  const DISPATCH_STATUS_LABEL = { idle: '배차대기', requesting: '기사연결중', accepted: '기사수락', driver_departed: '기사출발', driver_arrived: '기사도착', in_progress: '작업중', completion_requested: '완료요청', completed: '완료', canceled: '취소됨', reassign_needed: '재배차필요' };

  function renderProgress(progress) {
    if (!progress) {
      progressPanel.hidden = true;
      return;
    }
    progressPanel.hidden = false;
    const statusLabel = JOB_STATUS_LABEL[progress.status] || progress.status || '-';
    const dispatchLabel = DISPATCH_STATUS_LABEL[progress.dispatchStatus] || progress.dispatchStatus || '-';
    progressText.textContent = `주문 ${statusLabel} / 배차 ${dispatchLabel}`;
    departBtn.hidden = !progress.canDepart;
    arriveBtn.hidden = !progress.canArrive;
    startBtn.hidden = !progress.canStart;
    requestCompleteBtn.hidden = !progress.canRequestComplete;
  }

  async function loadAssignment() {
    if (!token && !jobId) {
      info.textContent = '유효하지 않은 접근입니다.';
      disablePrimary(true);
      disableProgress(true);
      return null;
    }

    const url = jobId
      ? `/.netlify/functions/driver-respond?jobId=${encodeURIComponent(jobId)}`
      : `/.netlify/functions/driver-respond?token=${encodeURIComponent(token)}`;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const res = await fetch(url, { headers });
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
        <div><strong>먼저 전문가 가입과 위탁운송 계약 동의가 필요해요.</strong></div>
        <div style="margin-top:8px;">계약 동의가 끝나야 배차 응답을 할 수 있어요.</div>
        ${data.joinUrl ? `<a class="btn primary link-btn" href="${data.joinUrl}">전문가 가입하고 계약 동의하기</a>` : ''}
      `;
      disablePrimary(true);
      disableProgress(true);
      note.disabled = true;
      return data;
    }

    if (data.accepted) {
      disablePrimary(true);
      renderProgress(data.progress);
      if (countdownInterval) clearInterval(countdownInterval);
      expiryCountdown.hidden = true;
    } else {
      disablePrimary(false);
      progressPanel.hidden = true;
      startCountdown(data.assignment?.expires_at);
    }

    return data;
  }

  async function respond(action) {
    disablePrimary(true);
    disableProgress(true);
    result.textContent = '처리 중...';
    const body = jobId
      ? { jobId, action, responseNote: note.value.trim() }
      : { token, action, responseNote: note.value.trim() };
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch('/.netlify/functions/driver-respond', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
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

  let countdownInterval = null;

  function startCountdown(expiresAt) {
    if (countdownInterval) clearInterval(countdownInterval);
    if (!expiresAt) return;

    function tick() {
      const remaining = Math.max(0, new Date(expiresAt) - Date.now());
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        expiryCountdown.textContent = '응답 시간이 초과됐어요. 페이지를 새로고침해주세요.';
        expiryCountdown.hidden = false;
        disablePrimary(true);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      expiryCountdown.textContent = `응답 가능 시간: ${mins}분 ${String(secs).padStart(2, '0')}초`;
      expiryCountdown.hidden = false;
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  acceptBtn.onclick = async () => { await respond('accept'); startChatPolling(); };
  declineBtn.onclick = () => respond('decline');
  departBtn.onclick = () => respond('depart');
  arriveBtn.onclick = () => respond('arrive');
  startBtn.onclick = () => respond('start');
  requestCompleteBtn.onclick = () => respond('request_complete');

  // ── 채팅 ──────────────────────────────────────────────
  const chatPanel = document.getElementById('chatPanel');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const btnChatSend = document.getElementById('btnChatSend');
  const chatStatus = document.getElementById('chatStatus');
  let chatPollInterval = null;
  let lastMessageCount = 0;

  function renderChatMessages(messages) {
    if (!messages.length) {
      chatMessages.innerHTML = '<div style="color:#9ca3af; font-size:13px; text-align:center; margin:auto;">아직 메시지가 없어요.</div>';
      return;
    }
    chatMessages.innerHTML = messages.map((m) => {
      const isMine = m.sender_type === 'driver';
      const bg = isMine ? '#0f766e' : '#fff';
      const color = isMine ? '#fff' : '#111';
      const align = isMine ? 'flex-end' : 'flex-start';
      const time = new Date(m.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      return `<div style="display:flex; flex-direction:column; align-items:${align}; gap:2px;">
        <div style="max-width:80%; padding:8px 12px; border-radius:12px; background:${bg}; color:${color}; font-size:14px; line-height:1.5; word-break:break-word;">${escapeHtml(m.content)}</div>
        <span style="font-size:11px; color:#9ca3af;">${isMine ? '나' : '고객'} · ${time}</span>
      </div>`;
    }).join('');
    if (messages.length !== lastMessageCount) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
      lastMessageCount = messages.length;
    }
  }

  async function fetchMessages() {
    try {
      const chatToken = token || jobId;
      const senderParam = token ? `&token=${encodeURIComponent(token)}` : `&jobId=${encodeURIComponent(jobId)}`;
      const chatHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch(`/.netlify/functions/get-messages?sender_type=driver${senderParam}`, { headers: chatHeaders });
      const data = await res.json();
      if (data.success) renderChatMessages(data.messages || []);
    } catch { /* 폴링 실패 무시 */ }
  }

  async function sendMessage() {
    const content = chatInput.value.trim();
    if (!content) return;
    btnChatSend.disabled = true;
    chatStatus.textContent = '전송 중...';
    try {
      const msgBody = token
        ? { sender_type: 'driver', token, content }
        : { sender_type: 'driver', jobId, content };
      const msgHeaders = { 'Content-Type': 'application/json' };
      if (accessToken) msgHeaders.Authorization = `Bearer ${accessToken}`;
      const res = await fetch('/.netlify/functions/send-message', {
        method: 'POST',
        headers: msgHeaders,
        body: JSON.stringify(msgBody)
      });
      const data = await res.json();
      if (data.success) {
        chatInput.value = '';
        chatStatus.textContent = '';
        await fetchMessages();
      } else {
        chatStatus.textContent = data.error || '전송에 실패했어요.';
      }
    } catch {
      chatStatus.textContent = '전송 중 오류가 발생했어요.';
    }
    btnChatSend.disabled = false;
  }

  function startChatPolling() {
    if (chatPollInterval) return;
    chatPanel.hidden = false;
    fetchMessages();
    chatPollInterval = setInterval(fetchMessages, 10000);
  }

  btnChatSend.onclick = sendMessage;
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

  const data = await loadAssignment();
  if (data?.accepted) startChatPolling();
}

// jobId 방식 — 세션 준비 후 실행
const _qs = new URLSearchParams(location.search);
if (_qs.get('jobId')) {
  window.dd.onSupabaseReady(() => initAccept());
} else {
  initAccept();
}
