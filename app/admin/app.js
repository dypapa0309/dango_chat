let currentFilter = 'all';
const ADMIN_TOKEN_KEY = 'dang_o_admin_token';
let runtimeAdminToken = '';
const adminPage = document.body?.dataset?.adminPage || 'orders';

const money = (n) => `${Number(n || 0).toLocaleString()}원`;
const api = (name) => `${window.dd.apiBase}/${name}`;

function escapeHtml(str) {
  return String(str).replace(/[&<>\"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function maskAccountNumber(value) {
  if (!value) return '계좌 미등록';
  const text = String(value);
  if (text.length <= 4) return text;
  return `${text.slice(0, -4).replace(/[0-9]/g, '*')}${text.slice(-4)}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function renderAssignmentItems(assignments = []) {
  if (!assignments.length) return '<div class="mini-card muted">배차 이력이 아직 없어요.</div>';
  return `<div class="detail-list">${assignments.map((assignment) => `
    <div class="detail-item">
      <strong>${escapeHtml(assignment.drivers?.name || '기사 미확인')} · ${escapeHtml(assignment.status || '-')}</strong>
      <div class="row">요청순서 ${Number(assignment.request_order || 0)} / 만료 ${formatDateTime(assignment.expires_at)}</div>
      <div class="row">${escapeHtml(assignment.drivers?.phone || '-')} / 차량 ${escapeHtml(assignment.drivers?.vehicle_type || '-')}</div>
    </div>
  `).join('')}</div>`;
}

function renderPaymentItems(payments = []) {
  if (!payments.length) return '<div class="mini-card muted">결제 내역이 아직 없어요.</div>';
  return `<div class="detail-list">${payments.map((payment) => `
    <div class="detail-item">
      <strong>${money(payment.amount)} · ${escapeHtml(payment.status || '-')}</strong>
      <div class="row">${escapeHtml(payment.method || payment.payment_type || '-')} / ${formatDateTime(payment.paid_at || payment.created_at)}</div>
    </div>
  `).join('')}</div>`;
}

function renderSettlementItems(settlements = []) {
  if (!settlements.length) return '<div class="mini-card muted">정산 내역이 아직 없어요.</div>';
  return `<div class="detail-list">${settlements.map((settlement) => `
    <div class="detail-item">
      <strong>${money(settlement.amount)} · ${escapeHtml(settlement.status || '-')}</strong>
      <div class="row">정산기간 ${escapeHtml(settlement.period_key || '-')} / 지급 ${formatDateTime(settlement.paid_at)}</div>
      <div class="row">${escapeHtml(settlement.paid_by || '-')} / ${escapeHtml(settlement.payout_memo || '-')}</div>
    </div>
  `).join('')}</div>`;
}

function renderLogItems(logs = []) {
  if (!logs.length) return '<div class="mini-card muted">배차 로그가 아직 없어요.</div>';
  return `<div class="detail-list">${logs.map((log) => `
    <div class="detail-item">
      <strong>${escapeHtml(log.event_type || '-')}</strong>
      <div class="row">${escapeHtml(log.prev_status || '-')} → ${escapeHtml(log.next_status || '-')}</div>
      <div class="row">${formatDateTime(log.created_at)} / ${escapeHtml(log.message || '-')}</div>
    </div>
  `).join('')}</div>`;
}

function summarizeCountMap(obj = {}) {
  const entries = Object.entries(obj || {}).filter(([, value]) => Number(value || 0) > 0);
  if (!entries.length) return '선택 없음';
  return entries.map(([key, value]) => `${escapeHtml(key)} ${Number(value)}개`).join(', ');
}

function formatMoveType(moveType) {
  const map = {
    normal: '일반이사',
    half: '반포장이사',
    storage: '보관이사'
  };
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

function renderRequestSummary(job) {
  const item = job.item_summary || {};
  const option = job.option_summary || {};
  const lines = [];
  if (item.vehicle) lines.push(`<div><span>차량</span><strong>${escapeHtml(item.vehicle)}</strong></div>`);
  if (item.moveType) lines.push(`<div><span>이사 방식</span><strong>${escapeHtml(formatMoveType(item.moveType))}</strong></div>`);
  if (item.loadLevel !== undefined) lines.push(`<div><span>짐양</span><strong>${escapeHtml(formatLoadLevel(item.loadLevel))}</strong></div>`);
  if (job.distance_km != null) lines.push(`<div><span>이동 거리</span><strong>${Number(job.distance_km || 0).toFixed(1)}km</strong></div>`);
  if (job.weight_kg != null) lines.push(`<div><span>예상 무게</span><strong>${Number(job.weight_kg || 0)}kg</strong></div>`);
  if (job.via_address) lines.push(`<div><span>경유지</span><strong>${escapeHtml(job.via_address)}</strong></div>`);
  if (item.ride) lines.push(`<div><span>동승</span><strong>${Number(item.ride || 0)}명</strong></div>`);
  return `
    <div class="detail-kv">${lines.join('') || '<div><span>요약</span><strong>저장된 신청 요약이 없어요.</strong></div>'}</div>
    <div class="detail-list" style="margin-top:12px;">
      <div class="detail-item">
        <strong>가구 · 가전</strong>
        <div class="row">${summarizeCountMap(item.items)}</div>
      </div>
      <div class="detail-item">
        <strong>경유지 짐</strong>
        <div class="row">${summarizeCountMap(item.waypointItems)}</div>
      </div>
      <div class="detail-item">
        <strong>버릴 물건</strong>
        <div class="row">출발지: ${summarizeCountMap(item.throwFrom)}</div>
        <div class="row">도착지: ${summarizeCountMap(item.throwTo)}</div>
      </div>
      <div class="detail-item">
        <strong>옵션</strong>
        <div class="row">
          ${
            [
              option.helper ? '기사 도움' : null,
              option.helperFrom ? '출발지 도움' : null,
              option.helperTo ? '도착지 도움' : null,
              option.packing ? '반포장' : null,
              option.cleaning ? '청소 연계' : null,
              option.via_stop ? '경유지 있음' : null,
              option.ladderFrom ? '출발지 사다리차' : null,
              option.ladderTo ? '도착지 사다리차' : null,
              option.cantCarryFrom ? '출발지 직접나르기 어려움' : null,
              option.cantCarryTo ? '도착지 직접나르기 어려움' : null
            ].filter(Boolean).join(', ') || '선택 없음'
          }
        </div>
      </div>
      ${
        job.customer_note
          ? `<div class="detail-item"><strong>고객 메모</strong><div class="row">${escapeHtml(job.customer_note).replace(/\n/g, '<br />')}</div></div>`
          : ''
      }
      ${
        job.raw_text
          ? `<div class="detail-item"><strong>문의 원문</strong><pre class="plain-note">${escapeHtml(job.raw_text)}</pre></div>`
          : ''
      }
    </div>
  `;
}

function renderJobDetail(job) {
  return `
    <div class="detail-grid">
      <section class="detail-card">
        <h4>기본 정보</h4>
        <div class="detail-kv">
          <div><span>고객명</span><strong>${escapeHtml(job.customer_name || '-')}</strong></div>
          <div><span>연락처</span><strong>${escapeHtml(job.customer_phone || '-')}</strong></div>
          <div><span>이동일</span><strong>${escapeHtml(job.move_date || '-')}</strong></div>
          <div><span>상태</span><strong>${escapeHtml(job.status || '-')} / ${escapeHtml(job.dispatch_status || '-')}</strong></div>
          <div><span>출발지</span><strong>${escapeHtml(job.start_address || '-')}</strong></div>
          <div><span>도착지</span><strong>${escapeHtml(job.end_address || '-')}</strong></div>
        </div>
      </section>
      <section class="detail-card">
        <h4>금액 정보</h4>
        <div class="detail-kv">
          <div><span>총 결제</span><strong>${money(job.total_price)}</strong></div>
          <div><span>당고 20%</span><strong>${money(job.company_amount)}</strong></div>
          <div><span>기사 80%</span><strong>${money(job.driver_amount)}</strong></div>
          <div><span>거리</span><strong>${Number(job.distance_km || 0).toFixed(1)}km</strong></div>
          <div><span>작성일</span><strong>${formatDateTime(job.created_at)}</strong></div>
        </div>
      </section>
      <section class="detail-card">
        <h4>신청 내용</h4>
        ${renderRequestSummary(job)}
      </section>
      <section class="detail-card">
        <h4>배차 이력</h4>
        ${renderAssignmentItems(job.assignments || [])}
      </section>
      <section class="detail-card">
        <h4>결제 내역</h4>
        ${renderPaymentItems(job.payments || [])}
      </section>
      <section class="detail-card">
        <h4>정산 내역</h4>
        ${renderSettlementItems(job.settlements || [])}
      </section>
      <section class="detail-card">
        <h4>배차 로그</h4>
        ${renderLogItems(job.dispatch_logs || [])}
      </section>
    </div>
    <details class="detail-debug">
      <summary>원본 데이터 보기</summary>
      <pre class="codebox">${escapeHtml(JSON.stringify(job, null, 2))}</pre>
    </details>
  `;
}

function buildDriverJoinMessage(driver, url) {
  return [
    `${driver?.name || '기사님'} 안녕하세요.`,
    '당고 기사 가입과 계약 동의 링크를 보내드립니다.',
    '아래 링크에서 정보 입력과 계약 동의를 완료해주세요.',
    url,
    '완료 후 배차 요청 링크에서 수락이나 거절을 진행할 수 있습니다.'
  ].join('\n');
}

function buildDriverRecruitMessage(url) {
  return [
    '당고 신규 기사 모집 안내입니다.',
    '소형이사와 소형청소 배차를 받을 기사님을 모집하고 있습니다.',
    '아래 공용 지원 링크에서 정보 입력과 계약 동의를 진행해주세요.',
    url,
    '지원이 접수되면 운영팀 확인 후 배차 가능 상태를 안내드립니다.'
  ].join('\n');
}

async function withButtonBusy(button, busyText, job) {
  if (!button) return job();
  const prevText = button.textContent;
  button.disabled = true;
  button.classList.add('is-busy');
  button.textContent = busyText;
  try {
    return await job();
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
    button.textContent = prevText;
  }
}

function normalizeAdminToken(value) {
  const token = String(value || '').trim();
  if (!token) return '';
  if (/^https?:\/\//i.test(token)) return '';
  return token;
}

function getAdminToken() {
  if (runtimeAdminToken) return runtimeAdminToken;
  const stored = normalizeAdminToken(localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  if (stored) {
    runtimeAdminToken = stored;
    return stored;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  return '';
}

function setAdminToken(token) {
  const safeToken = normalizeAdminToken(token);
  runtimeAdminToken = safeToken;
  if (safeToken) localStorage.setItem(ADMIN_TOKEN_KEY, safeToken);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function clearAdminToken() {
  runtimeAdminToken = '';
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function showAdminGate(message = '') {
  const gate = document.getElementById('adminGate');
  const app = document.getElementById('adminApp');
  gate.hidden = false;
  gate.style.display = '';
  app.hidden = true;
  app.style.display = 'none';
  document.getElementById('adminGateMessage').textContent = message;
  const submitBtn = document.querySelector('#adminGateForm button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = '운영툴 열기';
  }
}

function showAdminApp() {
  const gate = document.getElementById('adminGate');
  const app = document.getElementById('adminApp');
  gate.hidden = true;
  gate.style.display = 'none';
  app.hidden = false;
  app.style.display = '';
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function adminFetch(url, options = {}) {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(url, { ...options, headers, signal: controller.signal });
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === 'AbortError') {
      throw new Error('운영 데이터 응답이 늦어요. 잠시 뒤 다시 시도해주세요.');
    }
    throw error;
  }
  clearTimeout(timeout);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.clone().text().catch(() => '');
    if (/<!doctype html/i.test(text) || /<html/i.test(text)) {
      throw new Error('관리자 페이지는 정적 서버가 아니라 Netlify 주소나 npm run dev로 열어야 해요.');
    }
  }
  if (response.status === 401 || response.status === 503) {
    let message = '운영 인증이 필요해요.';
    try {
      const json = await response.clone().json();
      message = json.error || message;
    } catch (_) {}
    showAdminGate(message);
    throw new Error(message);
  }
  return response;
}

async function loadJobs() {
  const jobCountEl = document.getElementById('jobCount');
  const list = document.getElementById('jobList');
  if (!jobCountEl || !list) return;
  const res = await adminFetch(`${api('get-jobs')}?status=${encodeURIComponent(currentFilter)}`);
  const data = await res.json();
  const jobs = data.jobs || [];
  jobCountEl.textContent = `${jobs.length}건`;
  list.innerHTML = '';

  jobs.forEach((job) => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-top">
        <div>
          <strong>${escapeHtml(job.customer_name || '고객명 없음')}</strong>
          <div class="row">${escapeHtml(job.move_date || '-')} · ${escapeHtml(job.customer_phone || '-')}</div>
        </div>
        <div class="badges">
          <span class="badge">${escapeHtml(job.status)}</span>
          <span class="badge">${escapeHtml(job.dispatch_status)}</span>
        </div>
      </div>
      <div class="row">${escapeHtml(job.start_address || '-')} → ${escapeHtml(job.end_address || '-')}</div>
      <div class="price">${money(job.total_price)}</div>
      <div class="row">당고 20% ${money(job.company_amount)} / 기사 정산 예정 80% ${money(job.driver_amount)}</div>
      <div class="card-actions">
        <button class="btn" data-action="detail">상세</button>
        <button class="btn primary" data-action="confirm">결제 확인</button>
        <button class="btn primary" data-action="assign">배차 요청</button>
        <button class="btn danger" data-action="cancel">요청 취소</button>
        <button class="btn" data-action="complete">예외 완료</button>
        <button class="btn" data-action="complete-link">완료 링크</button>
        <button class="btn" data-action="cancel-link">취소 링크</button>
        <button class="btn" data-action="paylink">결제 링크</button>
      </div>
    `;
    card.querySelector('[data-action="detail"]').onclick = (e) => withButtonBusy(e.currentTarget, '불러오는 중...', () => showDetail(job.id));
    card.querySelector('[data-action="confirm"]').onclick = (e) => withButtonBusy(e.currentTarget, '확인 중...', () => updateStatus(job.id, 'confirmed', 'idle', '관리자 확정'));
    card.querySelector('[data-action="assign"]').onclick = (e) => withButtonBusy(e.currentTarget, '배차 중...', () => requestAssign(job.id));
    card.querySelector('[data-action="cancel"]').onclick = (e) => withButtonBusy(e.currentTarget, '취소 중...', () => cancelAssign(job.id));
    card.querySelector('[data-action="complete"]').onclick = (e) => withButtonBusy(e.currentTarget, '완료 처리 중...', () => completeJob(job.id));
    card.querySelector('[data-action="complete-link"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', () => copyCompleteLink(job.id));
    card.querySelector('[data-action="cancel-link"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', () => copyCancelLink(job.id));
    card.querySelector('[data-action="paylink"]').onclick = (e) => withButtonBusy(e.currentTarget, '이동 중...', async () => {
      location.href = `/customer/pay.html?jobId=${encodeURIComponent(job.id)}`;
    });
    list.appendChild(card);
  });
}

async function loadDrivers() {
  const driverCountEl = document.getElementById('driverCount');
  const eligibleDriverCountEl = document.getElementById('eligibleDriverCount');
  const eligibleDriverSummaryEl = document.getElementById('eligibleDriverSummary');
  const eligibleList = document.getElementById('eligibleDriverList');
  const list = document.getElementById('driverList');
  const driverStatusSummaryEl = document.getElementById('driverStatusSummary');
  const driverSummaryCardsEl = document.getElementById('driverSummaryCards');
  if (!driverCountEl && !eligibleDriverCountEl && !eligibleDriverSummaryEl && !eligibleList && !list && !driverStatusSummaryEl && !driverSummaryCardsEl) return;
  const res = await adminFetch(api('get-drivers'));
  const data = await res.json();
  const drivers = data.drivers || [];
  if (driverCountEl) driverCountEl.textContent = `${drivers.length}명`;
  const pendingDrivers = drivers.filter((driver) => driver.status === 'pending_review');
  const activeDrivers = drivers.filter((driver) => driver.status === 'active');
  const contractReadyDrivers = drivers.filter((driver) => driver.consign_contract_agreed && driver.commercial_plate_confirmed);
  const eligibleDrivers = drivers.filter((driver) =>
    driver.status === 'active' &&
    driver.dispatch_enabled &&
    driver.consign_contract_agreed &&
    driver.commercial_plate_confirmed
  );
  if (driverStatusSummaryEl) {
    driverStatusSummaryEl.textContent = `지원대기 ${pendingDrivers.length}명 / 활성 ${activeDrivers.length}명`;
  }
  if (driverSummaryCardsEl) {
    driverSummaryCardsEl.innerHTML = `
      <div class="summary-card">
        <div class="muted">지원 대기</div>
        <strong>${pendingDrivers.length}명</strong>
        <div class="row">공용 모집 링크 접수 기준</div>
      </div>
      <div class="summary-card">
        <div class="muted">계약 완료</div>
        <strong>${contractReadyDrivers.length}명</strong>
        <div class="row">계약 동의 + 영업용 확인 완료</div>
      </div>
      <div class="summary-card">
        <div class="muted">배차 가능</div>
        <strong>${eligibleDrivers.length}명</strong>
        <div class="row">활성 + 배차허용 + 계약완료</div>
      </div>
    `;
  }
  if (eligibleDriverCountEl) eligibleDriverCountEl.textContent = `${eligibleDrivers.length}명`;
  if (eligibleDriverSummaryEl) {
    eligibleDriverSummaryEl.textContent =
      `활성 ${drivers.filter((driver) => driver.status === 'active').length}명 / 배차허용 ${drivers.filter((driver) => driver.dispatch_enabled).length}명 / 계약완료 ${drivers.filter((driver) => driver.consign_contract_agreed && driver.commercial_plate_confirmed).length}명`;
  }
  if (eligibleList) {
    eligibleList.innerHTML = '';
    eligibleDrivers.forEach((driver) => {
      const item = document.createElement('div');
      item.className = 'eligible-driver';
      item.innerHTML = `
        <strong>${escapeHtml(driver.name || '기사')}</strong>
        <div class="row">${escapeHtml(driver.phone || '-')} / ${escapeHtml(driver.vehicle_type || '-')}</div>
        <div class="row">계약 완료 / 배차 허용 / 완료 ${Number(driver.completed_jobs || 0)}건</div>
      `;
      eligibleList.appendChild(item);
    });
    if (!eligibleList.innerHTML.trim()) {
      eligibleList.innerHTML = '<div class="mini-card muted">지금 바로 배차 가능한 기사가 없어요. 기사 가입과 계약 동의를 먼저 끝내야 합니다.</div>';
    }
  }
  if (!list) return;
  list.innerHTML = '';

  drivers.forEach((driver) => {
    const card = document.createElement('div');
    card.className = 'driver-card';
    card.innerHTML = `
      <div class="job-top">
        <div>
          <strong>${escapeHtml(driver.name || '기사')}</strong>
          <div class="row">${escapeHtml(driver.phone || '-')} · 완료 ${Number(driver.completed_jobs || 0)}건</div>
        </div>
        <div class="settlement-meta">
          <span class="pill ${driver.payout_enabled ? 'ok' : 'off'}">${driver.payout_enabled ? '정산 가능' : '정산 보류'}</span>
          <span class="pill ${driver.consign_contract_agreed && driver.commercial_plate_confirmed ? 'ok' : 'warn'}">${driver.consign_contract_agreed && driver.commercial_plate_confirmed ? '계약 완료' : '계약 필요'}</span>
          <span class="pill ${driver.tax_withholding_agreed && driver.tax_id_number && driver.tax_address ? 'ok' : 'warn'}">${driver.tax_withholding_agreed && driver.tax_id_number && driver.tax_address ? '세금정보 완료' : '세금정보 필요'}</span>
          <span class="pill">${escapeHtml(driver.status || '-')}</span>
        </div>
      </div>
      <div class="row">차량 ${escapeHtml(driver.vehicle_type || '-')} / 번호 ${escapeHtml(driver.vehicle_number || '-')}</div>
      <div class="driver-grid">
        <select data-field="status">
          <option value="pending_review" ${driver.status === 'pending_review' ? 'selected' : ''}>지원 대기</option>
          <option value="active" ${driver.status === 'active' ? 'selected' : ''}>활성</option>
          <option value="inactive" ${driver.status === 'inactive' ? 'selected' : ''}>비활성</option>
        </select>
        <label class="check"><input type="checkbox" data-field="dispatchEnabled" ${driver.dispatch_enabled ? 'checked' : ''} /> 배차 허용</label>
        <input type="text" data-field="bankName" value="${escapeHtml(driver.bank_name || '')}" placeholder="은행명" />
        <input type="text" data-field="accountHolder" value="${escapeHtml(driver.account_holder || '')}" placeholder="예금주" />
        <input type="text" data-field="accountNumber" value="${escapeHtml(driver.account_number || '')}" placeholder="계좌번호" />
        <label class="check"><input type="checkbox" data-field="payoutEnabled" ${driver.payout_enabled ? 'checked' : ''} /> 정산 가능</label>
        <textarea data-field="payoutNote" placeholder="정산 메모">${escapeHtml(driver.payout_note || '')}</textarea>
        <input type="text" data-field="taxName" value="${escapeHtml(driver.tax_name || '')}" placeholder="세금 신고용 이름" />
        <input type="date" data-field="taxBirthDate" value="${escapeHtml(driver.tax_birth_date || '')}" />
        <input type="text" data-field="taxIdNumber" value="${escapeHtml(driver.tax_id_number || '')}" placeholder="주민등록번호 또는 사업자등록번호" />
        <input type="email" data-field="taxEmail" value="${escapeHtml(driver.tax_email || '')}" placeholder="세금 신고용 이메일" />
        <label class="check"><input type="checkbox" data-field="taxWithholdingAgreed" ${driver.tax_withholding_agreed ? 'checked' : ''} /> 3.3% 세금 정산 동의</label>
        <textarea data-field="taxAddress" placeholder="세금 신고용 주소">${escapeHtml(driver.tax_address || '')}</textarea>
        <textarea data-field="internalMemo" placeholder="기사 내부 메모">${escapeHtml(driver.internal_memo || '')}</textarea>
      </div>
      <div class="driver-actions">
        <button class="btn" data-action="copy-join">개별 온보딩 링크 복사</button>
        <button class="btn" data-action="copy-message">개별 온보딩 문구 복사</button>
        <button class="btn primary" data-action="save-driver">기사 정보 저장</button>
      </div>
    `;

    card.querySelector('[data-action="copy-join"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
      if (!driver.join_token) return alert('기사 가입 토큰이 없어요.');
      const url = `${location.origin}/driver/join.html?token=${encodeURIComponent(driver.join_token)}`;
      await navigator.clipboard.writeText(url);
      alert('기사 가입 링크를 복사했어요.');
    });

    card.querySelector('[data-action="copy-message"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
      if (!driver.join_token) return alert('기사 가입 토큰이 없어요.');
      const url = `${location.origin}/driver/join.html?token=${encodeURIComponent(driver.join_token)}`;
      await navigator.clipboard.writeText(buildDriverJoinMessage(driver, url));
      alert('기사 안내 문구를 복사했어요.');
    });

    card.querySelector('[data-action="save-driver"]').onclick = async (e) => withButtonBusy(e.currentTarget, '저장 중...', async () => {
      const payload = {
        driverId: driver.id,
        status: card.querySelector('[data-field="status"]').value,
        dispatchEnabled: card.querySelector('[data-field="dispatchEnabled"]').checked,
        bankName: card.querySelector('[data-field="bankName"]').value,
        accountHolder: card.querySelector('[data-field="accountHolder"]').value,
        accountNumber: card.querySelector('[data-field="accountNumber"]').value,
        payoutEnabled: card.querySelector('[data-field="payoutEnabled"]').checked,
        payoutNote: card.querySelector('[data-field="payoutNote"]').value,
        taxName: card.querySelector('[data-field="taxName"]').value,
        taxBirthDate: card.querySelector('[data-field="taxBirthDate"]').value,
        taxIdNumber: card.querySelector('[data-field="taxIdNumber"]').value,
        taxEmail: card.querySelector('[data-field="taxEmail"]').value,
        taxAddress: card.querySelector('[data-field="taxAddress"]').value,
        taxWithholdingAgreed: card.querySelector('[data-field="taxWithholdingAgreed"]').checked,
        internalMemo: card.querySelector('[data-field="internalMemo"]').value
      };

      const saveRes = await adminFetch(api('update-driver-payout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saveData = await saveRes.json();
      if (!saveData.success) return alert(saveData.error || '기사 계좌 저장 실패');
      alert('기사 정보를 저장했어요.');
      loadDrivers();
      loadSettlementDashboard();
    });

    list.appendChild(card);
  });
}

function renderSettlementSummary(summary = {}) {
  const summaryEl = document.getElementById('settlementSummary');
  const cards = document.getElementById('settlementCards');
  if (!summaryEl || !cards) return;
  summaryEl.textContent = `대기 ${money(summary.approvedAmount)} / 보류 ${money(summary.heldAmount)}`;
  cards.innerHTML = `
    <div class="summary-card">
      <div class="muted">지급 대기</div>
      <strong>${money(summary.approvedAmount)}</strong>
      <div class="row">${Number(summary.approvedCount || 0)}건</div>
    </div>
    <div class="summary-card">
      <div class="muted">보류 중</div>
      <strong>${money(summary.heldAmount)}</strong>
      <div class="row">${Number(summary.heldCount || 0)}건</div>
    </div>
    <div class="summary-card">
      <div class="muted">최근 지급 완료</div>
      <strong>${money(summary.paidAmount)}</strong>
      <div class="row">${Number(summary.paidCount || 0)}건</div>
    </div>
  `;
}

async function loadPricingDashboard() {
  const pricingModeText = document.getElementById('pricingModeText');
  const pricingSummaryCards = document.getElementById('pricingSummaryCards');
  const pricingRecommendation = document.getElementById('pricingRecommendation');
  const channelList = document.getElementById('pricingChannelList');
  if (!pricingModeText || !pricingSummaryCards || !pricingRecommendation || !channelList) return;
  const res = await adminFetch(`${api('get-pricing-dashboard')}?hours=50`);
  const data = await res.json();
  if (!data.success) {
    alert(data.error || '가격 대시보드 조회 실패');
    return;
  }

  const pricing = data.state || {};
  const recommendation = data.recommendation || {};
  const metrics = recommendation.metrics || {};

  pricingModeText.textContent = `${pricing.mode || 'auto'} / 현재 ${Number(pricing.current_multiplier || 0).toFixed(3)}`;
  pricingSummaryCards.innerHTML = `
      <div class="summary-card">
      <div class="muted">최근 50시간 광고비</div>
      <strong>${money(metrics.spend)}</strong>
      <div class="row">읽힌 리드 ${Number(metrics.readLeads || 0)}건</div>
    </div>
    <div class="summary-card">
      <div class="muted">최근 50시간 결제</div>
      <strong>${Number(metrics.paidOrders || 0)}건</strong>
      <div class="row">총 결제 ${money(metrics.paidRevenue)}</div>
    </div>
    <div class="summary-card">
      <div class="muted">당고 몫 매출</div>
      <strong>${money(metrics.companyRevenue)}</strong>
      <div class="row">ROAS ${Number(metrics.companyRoas || 0).toFixed(2)}</div>
    </div>
  `;

  pricingRecommendation.innerHTML = `
    <strong>추천 배율</strong>
    <div class="row">현재 ${Number(recommendation.currentMultiplier || pricing.current_multiplier || 0).toFixed(3)} → 추천 ${Number(recommendation.nextMultiplier || pricing.current_multiplier || 0).toFixed(3)}</div>
    <div class="row">사유: ${escapeHtml(recommendation.reason || '추천 없음')}</div>
      <div class="row">결제 전환율: ${Number((metrics.paidConversionRate || 0) * 100).toFixed(1)}% / 최근 50시간 기준</div>
  `;

  channelList.innerHTML = '';
  (data.channels || []).forEach((channel) => {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <strong>${escapeHtml(channel.channel || 'unknown')}</strong>
      <div class="row">광고비 ${money(channel.spendAmount)} / 읽힘 ${Number(channel.leadReadCount || 0)}건 / 발송 ${Number(channel.leadSentCount || 0)}건</div>
      <div class="row">결제 ${Number(channel.paidOrders || 0)}건 / 총 결제 ${money(channel.paidRevenue)} / 당고 몫 ${money(channel.companyRevenue)}</div>
    `;
    channelList.appendChild(card);
  });

  if (!channelList.innerHTML.trim()) {
    channelList.innerHTML = '<div class="mini-card muted">광고 데이터가 아직 없어요.</div>';
  }
}

async function markSettlementsPaid(driverId, periodKey) {
  const paidBy = prompt('누가 이체했는지 적어주세요.', '운영자');
  if (paidBy === null) return;
  const memo = prompt('메모가 있으면 적어주세요.', '수동 이체 완료');
  if (memo === null) return;

  const res = await adminFetch(api('mark-settlements-paid'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, periodKey, paidBy, memo })
  });
  const data = await res.json();
  if (!data.success) return alert(data.error || '지급 완료 처리 실패');
  alert(`지급 완료 처리 ${data.count || 0}건 / ${money(data.totalAmount)}`);
  await loadSettlementDashboard();
}

async function loadSettlementDashboard() {
  const groupsEl = document.getElementById('settlementGroups');
  const heldEl = document.getElementById('heldSettlementList');
  const paidEl = document.getElementById('paidSettlementList');
  const settlementSummary = document.getElementById('settlementSummary');
  if (!groupsEl && !heldEl && !paidEl && !settlementSummary) return;
  const res = await adminFetch(api('get-settlement-dashboard'));
  const data = await res.json();
  if (!data.success) {
    alert(data.error || '정산 대시보드 조회 실패');
    return;
  }

  renderSettlementSummary(data.summary);

  groupsEl.innerHTML = '';
  (data.approvedGroups || []).forEach((group) => {
    const card = document.createElement('div');
    card.className = 'settlement-card';
    card.innerHTML = `
      <div class="job-top">
        <div>
          <strong>${escapeHtml(group.driverName || '기사 미확인')}</strong>
          <div class="row">${escapeHtml(group.periodLabel || '-')} · ${group.count}건</div>
        </div>
        <div class="price">${money(group.totalAmount)}</div>
      </div>
      <div class="settlement-meta">
        <span class="pill ${group.payoutEnabled ? 'ok' : 'warn'}">${group.payoutEnabled ? '정산 가능' : '계좌 확인 필요'}</span>
        <span class="pill">${escapeHtml(group.bankName || '은행 미등록')}</span>
        <span class="pill mono">${escapeHtml(maskAccountNumber(group.accountNumber))}</span>
      </div>
      <ul class="settlement-items">
        ${group.items.map((item) => `
          <li>
            <strong>${money(item.amount)}</strong>
            <div class="row">${escapeHtml(item.jobs?.customer_name || '고객')} · ${escapeHtml(item.jobs?.move_date || '-')}</div>
            <div class="row">${escapeHtml(item.jobs?.start_address || '-')} → ${escapeHtml(item.jobs?.end_address || '-')}</div>
          </li>
        `).join('')}
      </ul>
      <div class="driver-actions">
        <button class="btn primary" data-action="paid" ${group.payoutEnabled && group.accountNumber ? '' : 'disabled'}>이체 후 지급 완료 처리</button>
      </div>
    `;

    card.querySelector('[data-action="paid"]').onclick = (e) => withButtonBusy(e.currentTarget, '처리 중...', () => markSettlementsPaid(group.driverId, group.periodKey));
    groupsEl.appendChild(card);
  });

  if (!groupsEl.innerHTML.trim()) {
    groupsEl.innerHTML = '<div class="mini-card muted">지급 대기 중인 2주 정산 묶음이 없어요.</div>';
  }

  heldEl.innerHTML = '';
  (data.held || []).forEach((item) => {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <strong>${escapeHtml(item.drivers?.name || '기사 미확인')} · ${money(item.amount)}</strong>
      <div class="row">${escapeHtml(item.hold_reason || '보류 사유 없음')}</div>
      <div class="row">${escapeHtml(item.jobs?.customer_name || '고객')} / ${escapeHtml(item.jobs?.move_date || '-')}</div>
    `;
    heldEl.appendChild(card);
  });
  if (!heldEl.innerHTML.trim()) {
    heldEl.innerHTML = '<div class="mini-card muted">보류 중인 정산이 없어요.</div>';
  }

  paidEl.innerHTML = '';
  (data.paid || []).forEach((item) => {
    const card = document.createElement('div');
    card.className = 'mini-card';
    card.innerHTML = `
      <strong>${escapeHtml(item.drivers?.name || '기사 미확인')} · ${money(item.amount)}</strong>
      <div class="row">${escapeHtml(item.paid_at || '-')} · ${escapeHtml(item.paid_by || '운영자')}</div>
      <div class="row">${escapeHtml(item.payout_memo || '수동 이체 완료')}</div>
    `;
    paidEl.appendChild(card);
  });
  if (!paidEl.innerHTML.trim()) {
    paidEl.innerHTML = '<div class="mini-card muted">최근 지급 완료 내역이 없어요.</div>';
  }
}

async function showDetail(jobId) {
  const res = await adminFetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  document.getElementById('detailBody').innerHTML = renderJobDetail(data.job);
  document.getElementById('detailDialog').showModal();
}

async function updateStatus(jobId, status, dispatchStatus, note) {
  const res = await adminFetch(api('update-job-status'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, status, dispatchStatus, note })
  });
  const data = await res.json();
  if (!data.success) alert(data.error || '실패');
  await loadAll();
}

async function requestAssign(jobId) {
  const res = await adminFetch(api('assign-request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) {
    const detail = data.detail ? `\n${data.detail}` : '';
    return alert(`${data.error || '배차 요청 실패'}${detail}`);
  }
  alert(`배차 요청 완료: ${data.driver?.name || '-'}`);
  await loadAll();
}

async function cancelAssign(jobId) {
  const res = await adminFetch(api('cancel-assignment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) alert(data.error || '취소 실패');
  await loadAll();
}

async function completeJob(jobId) {
  await updateStatus(jobId, 'completed', 'completed', '관리자 예외 완료');
  await adminFetch(api('createSettlement'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  await loadAll();
}

async function copyCompleteLink(jobId) {
  const res = await adminFetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_complete_token;
  if (!token) return alert('고객 완료 토큰이 없어요.');
  const url = `${location.origin}/customer/complete.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  alert('고객 완료 링크를 복사했어요.');
}

async function copyCancelLink(jobId) {
  const res = await adminFetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_cancel_token;
  if (!token) return alert('고객 취소 토큰이 없어요.');
  const url = `${location.origin}/customer/cancel.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  alert('고객 취소 링크를 복사했어요.');
}

async function loadAll() {
  let tasks = [];
  if (adminPage === 'orders') tasks = [loadJobs(), loadDrivers()];
  if (adminPage === 'drivers') tasks = [loadDrivers()];
  if (adminPage === 'finance') tasks = [loadSettlementDashboard(), loadPricingDashboard()];
  const results = await Promise.allSettled(tasks);
  const firstRejected = results.find((result) => result.status === 'rejected');
  if (firstRejected) {
    console.warn('운영툴 일부 패널 로드 실패', firstRejected.reason);
  }
}

async function bootstrapAdmin() {
  showAdminApp();
  if (adminPage === 'orders') {
    await loadJobs();
    loadDrivers().catch((error) => console.warn('기사 패널 로드 실패', error));
    return;
  }
  if (adminPage === 'drivers') {
    await loadDrivers();
    return;
  }
  if (adminPage === 'finance') {
    await loadSettlementDashboard();
    loadPricingDashboard().catch((error) => console.warn('가격 패널 로드 실패', error));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const gateForm = document.getElementById('adminGateForm');
  const gateInput = document.getElementById('adminTokenInput');
  const btnLogout = document.getElementById('btnLogout');
  const gateSubmitBtn = gateForm.querySelector('button[type="submit"]');

  gateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = gateInput.value.trim();
    if (!token) {
      showAdminGate('운영 비밀번호를 입력해주세요.');
      return;
    }
    console.log('ADMIN_LOGIN_ATTEMPT', {
      tokenPreview: `${token.slice(0, 2)}***${token.slice(-2)}`,
      tokenLength: token.length
    });
    document.getElementById('adminGateMessage').textContent = '운영 비밀번호를 확인하고 있어요.';
    gateSubmitBtn.disabled = true;
    gateSubmitBtn.textContent = '확인 중이에요...';
    setAdminToken(token);
    try {
      await bootstrapAdmin();
      gateInput.value = '';
    } catch (error) {
      clearAdminToken();
      showAdminGate(error.message || '운영 인증에 실패했어요.');
    }
  });

  document.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      loadJobs();
    });
  });
  document.getElementById('btnRefresh')?.addEventListener('click', (e) => {
    withButtonBusy(e.currentTarget, '새로고침 중...', () => loadAll());
  });
  document.getElementById('btnCopyRecruitLink')?.addEventListener('click', (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
    const url = `${location.origin}/driver/apply.html`;
    await navigator.clipboard.writeText(url);
    alert('신규 기사 모집 링크를 복사했어요.');
  }));
  document.getElementById('btnCopyRecruitMessage')?.addEventListener('click', (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
    const url = `${location.origin}/driver/apply.html`;
    await navigator.clipboard.writeText(buildDriverRecruitMessage(url));
    alert('신규 기사 모집 문구를 복사했어요.');
  }));
  btnLogout?.addEventListener('click', () => {
    clearAdminToken();
    showAdminGate('로그아웃했어요.');
  });
  document.getElementById('btnAutoDispatch')?.addEventListener('click', async (e) => withButtonBusy(e.currentTarget, '재배차 중...', async () => {
    const res = await adminFetch(api('auto-dispatch'));
    const data = await res.json();
    alert(`자동 재배차 처리: ${data.count || 0}건`);
    await loadAll();
  }));
  document.getElementById('btnCloseDialog')?.addEventListener('click', () => document.getElementById('detailDialog')?.close());
  const marketingDateInput = document.querySelector('#marketingForm input[name="metricAt"]');
  if (marketingDateInput && !marketingDateInput.value) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    marketingDateInput.value = local;
  }

  document.getElementById('quickForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      customer_name: fd.get('customer_name'),
      customer_phone: fd.get('customer_phone'),
      move_date: fd.get('move_date'),
      start_address: fd.get('start_address'),
      end_address: fd.get('end_address'),
      distance_km: Number(fd.get('distance_km') || 0),
      floor: Number(fd.get('floor') || 0),
      weight_kg: Number(fd.get('weight_kg') || 0),
      option_summary: {
        helper: fd.get('helper') === 'on',
        packing: fd.get('packing') === 'on',
        cleaning: fd.get('cleaning') === 'on'
      }
    };

    const submitButton = e.target.querySelector('button[type="submit"]');
    await withButtonBusy(submitButton, '생성 중...', async () => {
      const res = await adminFetch(api('create-job'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) return alert(data.error || '주문 생성 실패');
      alert(`주문 생성 완료 / 총액 ${money(data.job.total_price)}`);
      e.target.reset();
      await loadAll();
    });
  });

  document.getElementById('marketingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
      const payload = {
      metricAt: fd.get('metricAt'),
      channel: fd.get('channel'),
      spendAmount: Number(fd.get('spendAmount') || 0),
      leadSentCount: Number(fd.get('leadSentCount') || 0),
      leadReadCount: Number(fd.get('leadReadCount') || 0),
      refundCount: Number(fd.get('refundCount') || 0),
      notes: fd.get('notes')
    };

    const submitButton = e.target.querySelector('button[type="submit"]');
    await withButtonBusy(submitButton, '저장 중...', async () => {
      const res = await adminFetch(api('upsert-ad-channel-daily'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) return alert(data.error || '광고 데이터 저장 실패');
      alert('광고 데이터를 저장했어요.');
      await loadPricingDashboard();
    });
  });

  document.getElementById('btnRecomputePricing')?.addEventListener('click', async (e) => withButtonBusy(e.currentTarget, '계산 중...', async () => {
    const res = await adminFetch(api('recompute-pricing'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: 50, force: true })
    });
    const data = await res.json();
    if (!data.success) return alert(data.error || '배율 재계산 실패');
    alert(`배율을 ${Number(data.recommendation?.nextMultiplier || 0).toFixed(3)}로 계산했어요.`);
    await loadPricingDashboard();
  }));
  const existingToken = getAdminToken();
  if (existingToken) {
    bootstrapAdmin().catch((error) => {
      clearAdminToken();
      showAdminGate(error.message || '운영 인증이 필요해요.');
    });
  } else {
    showAdminGate('운영 비밀번호를 먼저 입력해주세요.');
  }
});
