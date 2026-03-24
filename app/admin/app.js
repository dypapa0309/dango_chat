const FILTER_KEY = 'dang_o_admin_filter';
let currentFilter = (function () { try { return localStorage.getItem(FILTER_KEY) || 'all'; } catch { return 'all'; } })();
let currentPage = 0;
const PAGE_SIZE = 30;
const ADMIN_TOKEN_KEY = 'dang_o_admin_token';
let runtimeAdminToken = '';
const adminPage = document.body?.dataset?.adminPage || 'orders';
let latestSettlementDashboard = null;
let manualOrderDraft = null;
const HELPER_CUSTOMER_FEE = 60000;
const HELPER_DRIVER_FEE = 40000;
const LADDER_CUSTOMER_FEE = 120000;
const LADDER_DRIVER_FEE = 100000;
const SERVICE_OPTIONS = [
  { value: 'move', label: '이사', description: '원룸, 소형이사' },
  { value: 'clean', label: '청소', description: '입주청소, 정리' },
  { value: 'yd', label: '용달', description: '간편 용달, 1층 이동' },
  { value: 'waste', label: '폐기물', description: '수거, 정리' },
  { value: 'install', label: '설치', description: '가전, 가구 설치' },
  { value: 'errand', label: '심부름', description: '생활 대행, 전달' },
  { value: 'organize', label: '정리수납', description: '정리, 수납 컨설팅' },
  { value: 'ac_clean', label: '에어컨청소', description: '벽걸이, 스탠드 세척' },
  { value: 'appliance_clean', label: '가전청소', description: '세탁기, 건조기, 냉장고' },
  { value: 'interior', label: '인테리어', description: '부분 시공, 마감' },
  { value: 'interior_help', label: '인테리어 보조', description: '현장 보조, 자재 이동' },
  { value: 'pt', label: 'PT', description: '체형, 다이어트, 교정' },
  { value: 'vocal', label: '보컬', description: '취미, 오디션, 발성' },
  { value: 'golf', label: '골프', description: '입문, 스윙, 필드 레슨' },
  { value: 'tutor', label: '과외', description: '영어, 입시, 성인 학습' },
  { value: 'counseling', label: '심리상담', description: '개인, 커플, 가족 상담' }
];

const money = (n) => `${Number(n || 0).toLocaleString()}원`;
const api = (name) => `${window.dd.apiBase}/${name}`;

function normalizePhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function parseWon(value) {
  const number = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function countTruthy(...values) {
  return values.filter(Boolean).length;
}

function resolveRevenueSplit(totalPrice, companyAmount, driverAmount, optionSummary = {}) {
  const total = Math.max(0, Math.round(Number(totalPrice || 0)));
  const company = Math.max(0, Math.round(Number(companyAmount || 0)));
  const driver = Math.max(0, Math.round(Number(driverAmount || 0)));
  const helperCount = countTruthy(optionSummary.helperFrom, optionSummary.helperTo);
  const ladderCount = countTruthy(optionSummary.ladderFrom, optionSummary.ladderTo, optionSummary.waypointLadder);
  const helperCustomerAmount = helperCount * HELPER_CUSTOMER_FEE;
  const helperDriverAmount = helperCount * HELPER_DRIVER_FEE;
  const ladderCustomerAmount = ladderCount * LADDER_CUSTOMER_FEE;
  const ladderDriverAmount = ladderCount * LADDER_DRIVER_FEE;
  const specialCustomerAmount = helperCustomerAmount + ladderCustomerAmount;
  const specialDriverAmount = helperDriverAmount + ladderDriverAmount;
  const specialCompanyAmount = Math.max(0, specialCustomerAmount - specialDriverAmount);
  if (total > 0 && (helperCount > 0 || ladderCount > 0)) {
    const coreTotal = Math.max(0, total - specialCustomerAmount);
    const coreCompanyAmount = Math.round(coreTotal * 0.2);
    const coreDriverAmount = Math.max(0, coreTotal - coreCompanyAmount);
    return {
      total,
      companyAmount: coreCompanyAmount + specialCompanyAmount,
      driverAmount: coreDriverAmount + specialDriverAmount,
      helperCount,
      ladderCount
    };
  }
  if (total > 0 && company + driver === total) {
    return { total, companyAmount: company, driverAmount: driver, helperCount, ladderCount };
  }
  const normalizedCompany = Math.round(total * 0.2);
  return {
    total,
    companyAmount: normalizedCompany,
    driverAmount: Math.max(0, total - normalizedCompany),
    helperCount,
    ladderCount
  };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>\"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

function maskAccountNumber(value) {
  if (!value) return '계좌 미등록';
  const text = String(value);
  if (text.length <= 4) return text;
  return `${text.slice(0, -4).replace(/[0-9]/g, '*')}${text.slice(-4)}`;
}

(function initToast() {
  const style = document.createElement('style');
  style.textContent = [
    '#toastStack{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column-reverse;gap:8px;z-index:9999;pointer-events:none;max-width:380px}',
    '.toast{padding:12px 16px;border-radius:12px;font-size:13px;font-weight:600;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,.25);pointer-events:auto;cursor:pointer;animation:toastIn .2s ease;line-height:1.5}',
    '.toast-success{background:#166534}.toast-error{background:#991b1b}.toast-info{background:#1e3a5f}',
    '@keyframes toastIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
  ].join('');
  document.head.appendChild(style);
  const stack = document.createElement('div');
  stack.id = 'toastStack';
  document.body.appendChild(stack);
})();

function showToast(message, type = 'success') {
  const stack = document.getElementById('toastStack');
  if (!stack) { showToast(message); return; }
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  el.onclick = () => el.remove();
  stack.appendChild(el);
  setTimeout(() => el.remove(), type === 'error' ? 5000 : 3000);
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
      <strong>${escapeHtml(assignment.drivers?.name || '기사 미확인')} · ${escapeHtml(assignmentStatusLabel(assignment.status))}</strong>
      <div class="row">요청순서 ${Number(assignment.request_order || 0)} / 만료 ${formatDateTime(assignment.expires_at)}</div>
      <div class="row">${escapeHtml(assignment.drivers?.phone || '-')} / 차량 ${escapeHtml(assignment.drivers?.vehicle_type || '-')}</div>
    </div>
  `).join('')}</div>`;
}

function renderPaymentItems(payments = []) {
  if (!payments.length) return '<div class="mini-card muted">결제 내역이 아직 없어요.</div>';
  return `<div class="detail-list">${payments.map((payment) => `
    <div class="detail-item">
      <strong>${money(payment.amount)} · ${escapeHtml(paymentStatusLabel(payment.status))}</strong>
      <div class="row">${escapeHtml(payment.method || payment.payment_type || '-')} / ${formatDateTime(payment.paid_at || payment.created_at)}</div>
    </div>
  `).join('')}</div>`;
}

function renderSettlementItems(settlements = []) {
  if (!settlements.length) return '<div class="mini-card muted">정산 내역이 아직 없어요.</div>';
  return `<div class="detail-list">${settlements.map((settlement) => `
    <div class="detail-item">
      <strong>총 ${money(settlement.amount)} / 세금 ${money(settlement.withholding_amount)} / 실지급 ${money(settlement.net_amount)} · ${escapeHtml(settlementStatusLabel(settlement.status))}</strong>
      <div class="row">정산기간 ${escapeHtml(settlement.payout_period_key || settlement.period_key || '-')} / 지급 ${formatDateTime(settlement.paid_at)}</div>
      <div class="row">${escapeHtml(settlement.paid_by || '-')} / ${escapeHtml(settlement.payout_memo || '-')}</div>
    </div>
  `).join('')}</div>`;
}

function renderLogItems(logs = []) {
  if (!logs.length) return '<div class="mini-card muted">배차 로그가 아직 없어요.</div>';
  return `<div class="detail-list">${logs.map((log) => `
    <div class="detail-item">
      <strong>${escapeHtml(logEventLabel(log.event_type))}</strong>
      <div class="row">${escapeHtml(jobStatusLabel(log.prev_status) || '-')} → ${escapeHtml(jobStatusLabel(log.next_status) || '-')}</div>
      <div class="row">${formatDateTime(log.created_at)} / ${escapeHtml(log.message || '-')}</div>
    </div>
  `).join('')}</div>`;
}

function buildDriverSettlementSnapshot(driverId) {
  const fallback = {
    approvedCount: 0,
    approvedNetAmount: 0,
    approvedWithholdingAmount: 0,
    approvedTotalAmount: 0,
    heldCount: 0,
    heldNetAmount: 0,
    heldWithholdingAmount: 0,
    heldTotalAmount: 0,
    paidCount: 0,
    paidNetAmount: 0,
    paidWithholdingAmount: 0,
    paidTotalAmount: 0,
    nextPeriodLabel: '정산 기간 없음',
    latestPaidAt: null
  };
  const dashboard = latestSettlementDashboard;
  if (!dashboard || !driverId) return fallback;

  const approvedGroups = (dashboard.approvedGroups || []).filter((group) => group.driverId === driverId);
  const heldItems = (dashboard.held || []).filter((item) => item.driver_id === driverId);
  const paidItems = (dashboard.paid || []).filter((item) => item.driver_id === driverId);

  return {
    approvedCount: approvedGroups.reduce((acc, group) => acc + Number(group.count || 0), 0),
    approvedNetAmount: approvedGroups.reduce((acc, group) => acc + Number(group.netAmount || 0), 0),
    approvedWithholdingAmount: approvedGroups.reduce((acc, group) => acc + Number(group.withholdingAmount || 0), 0),
    approvedTotalAmount: approvedGroups.reduce((acc, group) => acc + Number(group.totalAmount || 0), 0),
    heldCount: heldItems.length,
    heldNetAmount: heldItems.reduce((acc, item) => acc + Number(item.net_amount || 0), 0),
    heldWithholdingAmount: heldItems.reduce((acc, item) => acc + Number(item.withholding_amount || 0), 0),
    heldTotalAmount: heldItems.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    paidCount: paidItems.length,
    paidNetAmount: paidItems.reduce((acc, item) => acc + Number(item.net_amount || 0), 0),
    paidWithholdingAmount: paidItems.reduce((acc, item) => acc + Number(item.withholding_amount || 0), 0),
    paidTotalAmount: paidItems.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    nextPeriodLabel: approvedGroups[0]?.periodLabel || heldItems[0]?.payout_period_key || '정산 기간 없음',
    latestPaidAt: paidItems[0]?.paid_at || null
  };
}

function renderDriverSummaryDetail(driver) {
  const settlement = buildDriverSettlementSnapshot(driver.id);
  return `
    <div class="detail-grid">
      <section class="detail-card">
        <h4>기본 정보</h4>
        <div class="detail-kv">
          <div><span>이름</span><strong>${escapeHtml(driver.name || '기사')}</strong></div>
          <div><span>전화번호</span><strong>${escapeHtml(driver.phone || '-')}</strong></div>
          <div><span>차량</span><strong>${escapeHtml(driver.vehicle_type || '-')}</strong></div>
          <div><span>차량 번호</span><strong>${escapeHtml(driver.vehicle_number || '-')}</strong></div>
          <div><span>지원 서비스</span><strong>${escapeHtml(normalizeDriverServices(driver).map(inferServiceTypeLabel).join(', ') || '-')}</strong></div>
          <div><span>상태</span><strong>${escapeHtml(driverStatusLabel(driver.status))}</strong></div>
          <div><span>배차 허용</span><strong>${driver.dispatch_enabled ? '허용' : '꺼짐'}</strong></div>
        </div>
      </section>
      <section class="detail-card">
        <h4>기사 실적</h4>
        <div class="detail-kv">
          <div><span>완료 건수</span><strong>${Number(driver.completed_jobs || 0)}건</strong></div>
          <div><span>평점</span><strong>${Number(driver.rating || 0).toFixed(2)}</strong></div>
          <div><span>수락률</span><strong>${Number(driver.acceptance_rate || 0)}%</strong></div>
          <div><span>응답 점수</span><strong>${Number(driver.response_score || 0)}점</strong></div>
        </div>
      </section>
      <section class="detail-card">
        <h4>정산 현황</h4>
        <div class="detail-kv">
          <div><span>지급 대기</span><strong>${money(settlement.approvedNetAmount)}</strong></div>
          <div><span>보류 금액</span><strong>${money(settlement.heldNetAmount)}</strong></div>
          <div><span>최근 지급 완료</span><strong>${money(settlement.paidNetAmount)}</strong></div>
          <div><span>미정산 건수</span><strong>${Number(settlement.approvedCount || 0) + Number(settlement.heldCount || 0)}건</strong></div>
          <div><span>다음 정산 기간</span><strong>${escapeHtml(settlement.nextPeriodLabel)}</strong></div>
          <div><span>최근 지급일</span><strong>${formatDateTime(settlement.latestPaidAt)}</strong></div>
        </div>
      </section>
      <section class="detail-card">
        <h4>정산 계좌</h4>
        <div class="detail-kv">
          <div><span>은행</span><strong>${escapeHtml(driver.bank_name || '-')}</strong></div>
          <div><span>계좌</span><strong>${escapeHtml(maskAccountNumber(driver.account_number))}</strong></div>
          <div><span>예금주</span><strong>${escapeHtml(driver.account_holder || '-')}</strong></div>
          <div><span>정산 가능</span><strong>${driver.payout_enabled ? '가능' : '보류'}</strong></div>
        </div>
      </section>
    </div>
  `;
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

function renderSpecialRequestTags(option = {}) {
  const tags = [];
  if (option.helperFrom) tags.push(`<span class="option-tag helper">출발지 인부 고객 ${money(HELPER_CUSTOMER_FEE)} / 기사 ${money(HELPER_DRIVER_FEE)}</span>`);
  if (option.helperTo) tags.push(`<span class="option-tag helper">도착지 인부 고객 ${money(HELPER_CUSTOMER_FEE)} / 기사 ${money(HELPER_DRIVER_FEE)}</span>`);
  if (option.ladderFrom) tags.push(`<span class="option-tag ladder">출발지 사다리차 고객 ${money(LADDER_CUSTOMER_FEE)} / 기사 ${money(LADDER_DRIVER_FEE)}</span>`);
  if (option.ladderTo) tags.push(`<span class="option-tag ladder">도착지 사다리차 고객 ${money(LADDER_CUSTOMER_FEE)} / 기사 ${money(LADDER_DRIVER_FEE)}</span>`);
  if (option.waypointLadder) tags.push(`<span class="option-tag ladder">경유지 사다리차 고객 ${money(LADDER_CUSTOMER_FEE)} / 기사 ${money(LADDER_DRIVER_FEE)}</span>`);
  return tags.length ? `<div class="option-tags">${tags.join('')}</div>` : '';
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
              option.waypointLadder ? '경유지 사다리차' : null,
              option.cantCarryFrom ? '출발지 직접나르기 어려움' : null,
              option.cantCarryTo ? '도착지 직접나르기 어려움' : null
            ].filter(Boolean).join(', ') || '선택 없음'
          }
        </div>
        ${renderSpecialRequestTags(option)}
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
  const split = resolveRevenueSplit(job.total_price, job.company_amount, job.driver_amount, job.option_summary || {});
  return `
    <div class="detail-grid">
      <section class="detail-card">
        <h4>기본 정보</h4>
        <div class="detail-kv">
          <div><span>고객명</span><strong>${escapeHtml(job.customer_name || '-')}</strong></div>
          <div><span>연락처</span><strong>${escapeHtml(job.customer_phone || '-')}</strong></div>
          <div><span>이동일</span><strong>${escapeHtml(job.move_date || '-')}</strong></div>
          <div><span>상태</span><strong>${escapeHtml(jobStatusLabel(job.status))} / ${escapeHtml(dispatchStatusLabel(job.dispatch_status))}</strong></div>
          <div><span>출발지</span><strong>${escapeHtml(job.start_address || '-')}</strong></div>
          <div><span>도착지</span><strong>${escapeHtml(job.end_address || '-')}</strong></div>
        </div>
      </section>
      <section class="detail-card">
        <h4>금액 정보</h4>
        <div class="detail-kv">
          <div><span>총 결제</span><strong>${money(job.total_price)}</strong></div>
          <div><span>당고 20%</span><strong>${money(split.companyAmount)}</strong></div>
          <div><span>기사 80%</span><strong>${money(split.driverAmount)}</strong></div>
          <div><span>거리</span><strong>${job.distance_km != null ? `${Number(job.distance_km || 0).toFixed(1)}km` : '미기록'}</strong></div>
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

function parseCountMapText(value) {
  const result = {};
  const text = String(value || '').trim();
  if (!text || text === '선택 없음' || text === '미사용') return result;
  text.split(/\s*,\s*/).forEach((part) => {
    const match = part.match(/(.+?)\s+(\d+)개$/);
    if (match) {
      result[match[1].trim()] = Number(match[2]);
    }
  });
  return result;
}

function parseThrowLine(value) {
  const result = { throwFrom: {}, throwTo: {} };
  const text = String(value || '').trim();
  if (!text || text === '미사용') return result;
  text.split(/\s*\/\s*/).forEach((part) => {
    const [label, detail] = part.split(/\s*:\s*/);
    if (!detail) return;
    if (label.includes('출발')) result.throwFrom = parseCountMapText(detail);
    if (label.includes('도착')) result.throwTo = parseCountMapText(detail);
  });
  return result;
}

function parseLoadLevel(value) {
  const text = String(value || '').trim();
  const map = {
    '없음': 0,
    '1~5개': 1,
    '6~10개': 2,
    '11~15개': 3,
    '16~20개': 4,
    '짐 거의 없음': 0,
    '가벼운 편': 1,
    '보통': 2,
    '많은 편': 3,
    '매우 많음': 4
  };
  return map[text] ?? 0;
}

function parseMoveType(value) {
  const text = String(value || '').trim();
  if (text.includes('반포장')) return 'half';
  if (text.includes('보관')) return 'storage';
  return 'normal';
}

function normalizeDriverServices(driver = {}) {
  const services = Array.isArray(driver.supported_services)
    ? driver.supported_services.filter(Boolean)
    : [];
  if (services.length) return [...new Set(services)];
  return [
    driver.supports_move !== false ? 'move' : null,
    driver.supports_clean ? 'clean' : null,
    driver.supports_yd ? 'yd' : null
  ].filter(Boolean);
}

function inferServiceTypeLabel(serviceType) {
  const map = {
    move: '이사',
    clean: '청소',
    yd: '용달',
    waste: '폐기물',
    install: '설치',
    errand: '심부름',
    organize: '정리수납',
    ac_clean: '에어컨청소',
    appliance_clean: '가전청소',
    interior: '인테리어',
    interior_help: '인테리어 보조',
    pt: 'PT',
    vocal: '보컬',
    golf: '골프',
    tutor: '과외',
    counseling: '심리상담'
  };
  return map[serviceType] || serviceType || '-';
}

function jobStatusLabel(s) {
  return { draft: '임시저장', deposit_pending: '결제대기', confirmed: '결제완료', assigned: '기사배정', in_progress: '작업중', completed: '완료', canceled: '취소됨', archived: '보관됨' }[s] || s || '-';
}

function dispatchStatusLabel(s) {
  return { idle: '배차대기', requesting: '기사연결중', accepted: '기사수락', driver_departed: '기사출발', driver_arrived: '기사도착', in_progress: '작업중', completion_requested: '완료요청', completed: '완료', canceled: '취소됨', reassign_needed: '재배차필요' }[s] || s || '-';
}

function assignmentStatusLabel(s) {
  return { requested: '요청됨', accepted: '수락', declined: '거절', expired: '만료', canceled: '취소됨', no_response: '무응답' }[s] || s || '-';
}

function paymentStatusLabel(s) {
  return { pending: '결제대기', paid: '결제완료', failed: '실패', canceled: '취소', refunded: '환불됨' }[s] || s || '-';
}

function settlementStatusLabel(s) {
  return { pending: '정산대기', approved: '지급예정', paid: '지급완료', held: '보류', canceled: '취소' }[s] || s || '-';
}

function logEventLabel(s) {
  return {
    assignment_requested: '배차요청', assignment_accepted: '배차수락', assignment_declined: '배차거절', assignment_expired: '배차만료',
    assignment_canceled: '배차취소', job_status_updated: '주문상태변경', dispatch_status_updated: '배차상태변경',
    deposit_paid: '예약금결제', job_completed: '작업완료', job_canceled: '주문취소',
    driver_departed: '기사출발', driver_arrived: '기사도착', completion_requested: '완료요청'
  }[s] || s || '-';
}

function driverStatusLabel(s) {
  return { active: '활성', inactive: '비활성', suspended: '정지' }[s] || s || '-';
}

function inferServiceTypeFromText(value) {
  const text = String(value || '').trim();
  if (text.includes('정리수납')) return 'organize';
  if (text.includes('에어컨')) return 'ac_clean';
  if (text.includes('가전청소')) return 'appliance_clean';
  if (text.includes('인테리어 보조')) return 'interior_help';
  if (text.includes('인테리어')) return 'interior';
  if (text.includes('PT')) return 'pt';
  if (text.includes('보컬')) return 'vocal';
  if (text.includes('골프')) return 'golf';
  if (text.includes('과외')) return 'tutor';
  if (text.includes('심리상담') || text.includes('심리 상담')) return 'counseling';
  if (text.includes('폐기물')) return 'waste';
  if (text.includes('설치')) return 'install';
  if (text.includes('심부름')) return 'errand';
  if (text.includes('청소')) return 'clean';
  if (text.includes('용달')) return 'yd';
  return 'move';
}

function renderDriverServiceBadges(driver) {
  const labels = normalizeDriverServices(driver).map((serviceType) => inferServiceTypeLabel(serviceType));
  return labels.length
    ? `<div class="service-tags">${labels.map((label) => `<span class="service-tag">${label}</span>`).join('')}</div>`
    : '<div class="service-tags"><span class="service-tag muted-tag">서비스 미선택</span></div>';
}

function renderServiceToggleInputs(selectedServices = [], prefix = 'service') {
  return `
    <details class="service-picker" open>
      <summary>
        <span>지원 서비스 선택</span>
        <span class="service-picker-copy">눌러서 서비스 범위를 정리합니다.</span>
      </summary>
      <div class="service-picker-body">
        <div class="service-toggle-grid">
          ${SERVICE_OPTIONS.map((service) => `
            <label class="service-toggle">
              <input type="checkbox" data-field="${prefix}::${service.value}" ${selectedServices.includes(service.value) ? 'checked' : ''} />
              <span><strong>${service.label}</strong><small>${service.description}</small></span>
            </label>
          `).join('')}
        </div>
      </div>
    </details>
  `;
}

function readSelectedServiceFields(root, prefix = 'service') {
  return SERVICE_OPTIONS
    .map((service) => ({
      value: service.value,
      input: root.querySelector(`[data-field="${prefix}::${service.value}"]`)
    }))
    .filter(({ input }) => input?.checked)
    .map(({ value }) => value);
}

function parseFloorFromCarry(value) {
  const text = String(value || '');
  const matches = [...text.matchAll(/(\d+)층/g)].map((match) => Number(match[1]));
  if (!matches.length) return 0;
  return Math.max(...matches);
}

function estimateWeightFromLoadLevel(loadLevel) {
  const map = { 0: 20, 1: 80, 2: 180, 3: 320, 4: 480 };
  return map[loadLevel] ?? 100;
}

function parseInquiryTextToPayload(rawText, customerName, customerPhone, forcedServiceType = '') {
  const text = String(rawText || '').trim();
  if (!text) throw new Error('주문서 내용을 붙여넣어주세요.');

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const findLine = (keyword) => lines.find((line) => line.includes(keyword)) || '';

  const lineMap = new Map();
  lines.forEach((line) => {
    const idx = line.indexOf(':');
    if (idx <= 0) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!lineMap.has(key)) lineMap.set(key, value);
  });

  const service = lineMap.get('서비스') || '이사·용달';
  const serviceType = forcedServiceType || inferServiceTypeFromText(service);
  const vehicle = lineMap.get('차량') || '';
  const moveTypeText = lineMap.get('이사 방식') || '일반이사';
  const moveType = parseMoveType(moveTypeText);
  const schedule = lineMap.get('일정') || '';
  const [moveDateRaw] = schedule.split('/').map((part) => part.trim());
  const moveDate = moveDateRaw || '';
  const startAddress = lineMap.get('출발지') || '';
  const endAddress = lineMap.get('도착지') || '';
  const viaAddress = lineMap.get('경유지') || null;
  const distanceKm = Number(String(lineMap.get('거리') || '').replace(/[^0-9.]/g, '')) || 0;
  const loadLevel = parseLoadLevel(lineMap.get('짐양'));
  const itemSummary = {
    vehicle,
    moveType,
    loadLevel,
    items: parseCountMapText((lineMap.get('가구·가전') || '').replace(/^가구·가전:\s*/, '')),
    waypointItems: parseCountMapText((lineMap.get('경유지 가구·가전') || '').replace(/^경유지 가구·가전:\s*/, '')),
    ride: Number(String(lineMap.get('동승') || '').replace(/[^0-9]/g, '')) || 0
  };
  const throwData = parseThrowLine(lineMap.get('버려주세요') || '');
  itemSummary.throwFrom = throwData.throwFrom;
  itemSummary.throwTo = throwData.throwTo;

  const helperLine = lineMap.get('인부') || '';
  const directCarryLine = lineMap.get('직접 나르기 어려움') || '';
  const ladderLine = lineMap.get('사다리차') || '';
  const optionSummary = {
    helper: helperLine && !helperLine.includes('미사용'),
    helperFrom: helperLine.includes('출발'),
    helperTo: helperLine.includes('도착'),
    packing: moveType === 'half',
    cleaning: Boolean(lineMap.get('입주청소 문의') || lineMap.get('입주청소')),
    via_stop: Boolean(viaAddress),
    ladderFrom: ladderLine.includes('출발'),
    ladderTo: ladderLine.includes('도착'),
    cantCarryFrom: directCarryLine.includes('출발'),
    cantCarryTo: directCarryLine.includes('도착')
  };

  const floor = Math.max(
    parseFloorFromCarry(findLine('출발 엘베없음')),
    parseFloorFromCarry(findLine('도착 엘베없음')),
    parseFloorFromCarry(lineMap.get('경유지 계단') || ''),
    parseFloorFromCarry(ladderLine)
  );
  const weightKg = estimateWeightFromLoadLevel(loadLevel);
  const total = parseWon(lineMap.get('홈페이지 예상 견적') || lineMap.get('예상 견적'));
  const companyAmount = Math.round(total * 0.2);
  const driverAmount = total - companyAmount;

  const extraNotes = [
    lineMap.get('가구·가전 기타사항') ? `가구·가전 기타사항: ${lineMap.get('가구·가전 기타사항')}` : null,
    lineMap.get('경유지 짐 기타사항') ? `경유지 짐 기타사항: ${lineMap.get('경유지 짐 기타사항')}` : null,
    lineMap.get('버려주세요 기타사항') ? `버려주세요 기타사항: ${lineMap.get('버려주세요 기타사항')}` : null,
    lineMap.get('경유지 버려주세요 기타사항') ? `경유지 버려주세요 기타사항: ${lineMap.get('경유지 버려주세요 기타사항')}` : null,
    lineMap.get('기타') ? `기타: ${lineMap.get('기타')}` : null
  ].filter(Boolean);

  if (!customerName?.trim()) throw new Error('고객명을 같이 넣어주세요.');
  if (normalizePhone(customerPhone).length < 10) throw new Error('연락처를 같이 정확히 넣어주세요.');
  if (!moveDate || !startAddress || !endAddress) throw new Error('일정, 출발지, 도착지는 주문서에 꼭 있어야 합니다.');

  return {
    payload: {
      customer_name: customerName.trim(),
      service_type: serviceType,
      customer_phone: normalizePhone(customerPhone),
      customer_note: extraNotes.join('\n') || null,
      move_date: moveDate,
      start_address: startAddress,
      end_address: endAddress,
      via_address: viaAddress,
      distance_km: distanceKm,
      floor,
      weight_kg: weightKg,
      item_summary: itemSummary,
      option_summary: optionSummary,
      raw_text: text,
      acquisition_source: 'manual',
      acquisition_medium: 'operator-copy',
      acquisition_campaign: service,
      created_by: 'admin-manual',
      updated_by: 'admin-manual',
      price_override: total > 0 ? {
        total,
        deposit: Math.round(total * 0.2),
        balance: total - Math.round(total * 0.2),
        driverAmount,
        companyAmount,
        version: 'manual-text-override'
      } : null
    },
    preview: {
      service,
      vehicle,
      moveTypeText,
      moveDate,
      startAddress,
      viaAddress,
      endAddress,
      distanceKm,
      loadLevelText: lineMap.get('짐양') || '-',
      total
    }
  };
}

function renderManualOrderPreview(preview, paymentUrl = '') {
  if (!preview) return '아직 파싱한 주문서가 없어요.';
  return `
    <div class="detail-kv">
      <div><span>서비스</span><strong>${escapeHtml(preview.service || '-')}</strong></div>
      <div><span>차량</span><strong>${escapeHtml(preview.vehicle || '-')}</strong></div>
      <div><span>이사 방식</span><strong>${escapeHtml(preview.moveTypeText || '-')}</strong></div>
      <div><span>일정</span><strong>${escapeHtml(preview.moveDate || '-')}</strong></div>
      <div><span>출발지</span><strong>${escapeHtml(preview.startAddress || '-')}</strong></div>
      <div><span>도착지</span><strong>${escapeHtml(preview.endAddress || '-')}</strong></div>
      <div><span>거리</span><strong>${Number(preview.distanceKm || 0).toFixed(1)}km</strong></div>
      <div><span>짐양</span><strong>${escapeHtml(preview.loadLevelText || '-')}</strong></div>
      <div><span>총 결제</span><strong>${money(preview.total || 0)}</strong></div>
    </div>
    ${
      paymentUrl
        ? `<div class="preview-paylink"><strong>결제 링크</strong><div class="row"><a href="${escapeHtml(paymentUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(paymentUrl)}</a></div></div>`
        : ''
    }
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
    '소형이사, 입주청소, 간편용달, 추가 서비스 배차를 받을 기사님을 모집하고 있습니다.',
    '아래 공용 지원 링크에서 정보 입력과 계약 동의를 진행해주세요.',
    url,
    '지원이 접수되면 운영팀 확인 후 배차 가능 상태를 안내드립니다.'
  ].join('\n');
}

function buildDriverGuideMessage(url) {
  return [
    '당고 기사 사용 안내입니다.',
    '가입과 계약 동의, 서비스 관리, 배차 수락, 출발과 도착, 완료 요청, 정산 흐름을 한 번에 볼 수 있습니다.',
    url,
    '실제 배차가 잡히면 기사님마다 별도 배차 링크가 따로 전달됩니다.'
  ].join('\n');
}

function buildDriverProfileMessage(driver, url) {
  return [
    `${driver?.name || '기사님'} 안녕하세요.`,
    '당고 기사 정보 관리 링크를 보내드립니다.',
    '아래 링크에서 가능한 서비스 추가·삭제와 정산 정보를 직접 수정해주세요.',
    url,
    '저장하면 이후 자동 배차 후보에도 바로 반영됩니다.'
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
  const res = await adminFetch(`${api('get-jobs')}?status=${encodeURIComponent(currentFilter)}&page=${currentPage}&limit=${PAGE_SIZE}`);
  const data = await res.json();
  const jobs = data.jobs || [];
  const total = data.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  jobCountEl.textContent = `${total}건`;
  list.innerHTML = '';

  jobs.forEach((job) => {
    const split = resolveRevenueSplit(job.total_price, job.company_amount, job.driver_amount, job.option_summary || {});
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-top">
        <div>
          <strong>${escapeHtml(job.customer_name || '고객명 없음')}</strong>
          <div class="row">${escapeHtml(job.move_date || '-')} · ${escapeHtml(job.customer_phone || '-')}</div>
        </div>
        <div class="badges">
          <span class="badge">${escapeHtml(inferServiceTypeLabel(job.service_type || (job.option_summary?.cleaning ? 'clean' : 'move')))}</span>
          <span class="badge">${escapeHtml(jobStatusLabel(job.status))}</span>
          <span class="badge">${escapeHtml(dispatchStatusLabel(job.dispatch_status))}</span>
        </div>
      </div>
      <div class="row">${escapeHtml(job.start_address || '-')} → ${escapeHtml(job.end_address || '-')}</div>
      <div class="price">${money(job.total_price)}</div>
      <div class="row">당고 20% ${money(split.companyAmount)} / 기사 정산 예정 80% ${money(split.driverAmount)}</div>
      ${renderSpecialRequestTags(job.option_summary || {})}
      <div class="card-actions">
        <button class="btn" data-action="detail">상세</button>
        <button class="btn primary" data-action="confirm">결제 확인</button>
        <button class="btn primary" data-action="assign">배차 요청</button>
        <button class="btn danger" data-action="cancel">요청 취소</button>
        <button class="btn" data-action="complete">관리자 강제 완료</button>
        <button class="btn" data-action="complete-link">완료 링크</button>
        <button class="btn" data-action="cancel-link">취소 링크</button>
        <button class="btn" data-action="regen-tokens">토큰 재발급</button>
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
    card.querySelector('[data-action="regen-tokens"]').onclick = (e) => withButtonBusy(e.currentTarget, '재발급 중...', () => regenCustomerTokens(job.id));
    card.querySelector('[data-action="paylink"]').onclick = (e) => withButtonBusy(e.currentTarget, '이동 중...', async () => {
      location.href = `/customer/pay.html?jobId=${encodeURIComponent(job.id)}`;
    });
    list.appendChild(card);
  });

  const pagEl = document.getElementById('jobPagination');
  if (pagEl) {
    if (totalPages <= 1) {
      pagEl.hidden = true;
    } else {
      pagEl.hidden = false;
      pagEl.innerHTML = `
        <button class="btn" id="btnPrevPage" ${currentPage <= 0 ? 'disabled' : ''}>이전</button>
        <span style="padding:0 12px;">${currentPage + 1} / ${totalPages}</span>
        <button class="btn" id="btnNextPage" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>다음</button>
      `;
      document.getElementById('btnPrevPage')?.addEventListener('click', () => { currentPage--; loadJobs(); });
      document.getElementById('btnNextPage')?.addEventListener('click', () => { currentPage++; loadJobs(); });
    }
  }
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
  if (eligibleList) {
    try {
      const settlementRes = await adminFetch(api('get-settlement-dashboard'));
      const settlementData = await settlementRes.json();
      if (settlementData.success) latestSettlementDashboard = settlementData;
    } catch (error) {
      console.warn('기사 정산 스냅샷 로드 실패', error);
    }
  }
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
      `활성 ${drivers.filter((driver) => driver.status === 'active').length}명 / 배차허용 ${drivers.filter((driver) => driver.dispatch_enabled).length}명 / 계약완료 ${drivers.filter((driver) => driver.consign_contract_agreed).length}명`;
  }
  if (eligibleList) {
    eligibleList.innerHTML = '';
    eligibleDrivers.forEach((driver) => {
      try {
        const item = document.createElement('div');
        item.className = 'eligible-driver';
        item.innerHTML = `
          <strong>${escapeHtml(driver.name || '기사')}</strong>
          <div class="row">${escapeHtml(driver.phone || '-')} / ${escapeHtml(driver.vehicle_type || '-')}</div>
          <div class="row">계약 완료 / 배차 허용 / 완료 ${Number(driver.completed_jobs || 0)}건</div>
          ${renderDriverServiceBadges(driver)}
        `;
        item.onclick = () => showDriverSummary(driver);
        eligibleList.appendChild(item);
      } catch (error) {
        console.warn('배차 가능 기사 카드 렌더링 실패', driver?.id, error);
      }
    });
    if (!eligibleList.innerHTML.trim()) {
      eligibleList.innerHTML = '<div class="mini-card muted">지금 바로 배차 가능한 기사가 없어요. 기사 가입과 계약 동의를 먼저 끝내야 합니다.</div>';
    }
  }
  if (!list) return;
  list.innerHTML = '';

  drivers.forEach((driver) => {
    try {
      const selectedServices = normalizeDriverServices(driver);
      const card = document.createElement('div');
      card.className = 'driver-card';
      card.innerHTML = `
      <details class="driver-detail">
        <summary class="driver-summary">
          <div class="driver-summary-copy">
            <strong>${escapeHtml(driver.name || '기사')}</strong>
            <div class="row">${escapeHtml(driver.phone || '-')}</div>
          </div>
          <div class="driver-summary-side">
            <span class="pill ${driver.consign_contract_agreed && driver.commercial_plate_confirmed ? 'ok' : 'warn'}">${driver.consign_contract_agreed && driver.commercial_plate_confirmed ? '계약 완료' : '계약 필요'}</span>
            <span class="pill">${escapeHtml(driverStatusLabel(driver.status))}</span>
          </div>
        </summary>
        <div class="driver-detail-body">
          <div class="driver-meta-grid">
            <div class="mini-card">
              <strong>기본 상태</strong>
              <div class="row">차량 ${escapeHtml(driver.vehicle_type || '-')} / 번호 ${escapeHtml(driver.vehicle_number || '-')}</div>
              <div class="row">완료 ${Number(driver.completed_jobs || 0)}건</div>
              ${renderDriverServiceBadges(driver)}
              <div class="settlement-meta">
                <span class="pill ${driver.payout_enabled ? 'ok' : 'off'}">${driver.payout_enabled ? '정산 가능' : '정산 보류'}</span>
                <span class="pill ${driver.tax_withholding_agreed && driver.tax_id_number && driver.tax_address ? 'ok' : 'warn'}">${driver.tax_withholding_agreed && driver.tax_id_number && driver.tax_address ? '세금정보 완료' : '세금정보 필요'}</span>
              </div>
            </div>
            <div class="mini-card">
              <strong>기사 링크</strong>
              <div class="row">가입과 계약 동의, 서비스 관리, 기사 사용 안내 문구를 여기서 복사합니다.</div>
              <div class="driver-actions compact">
                <button class="btn" data-action="copy-join">개별 온보딩 링크 복사</button>
                <button class="btn" data-action="copy-message">개별 온보딩 문구 복사</button>
                <button class="btn" data-action="copy-profile">정보 관리 링크 복사</button>
                <button class="btn" data-action="copy-profile-message">정보 관리 문구 복사</button>
                <button class="btn" data-action="copy-guide">기사 사용 안내 문구 복사</button>
              </div>
            </div>
          </div>
          <div class="driver-grid">
            <select data-field="status">
              <option value="pending_review" ${driver.status === 'pending_review' ? 'selected' : ''}>지원 대기</option>
              <option value="active" ${driver.status === 'active' ? 'selected' : ''}>활성</option>
              <option value="inactive" ${driver.status === 'inactive' ? 'selected' : ''}>비활성</option>
            </select>
            ${renderServiceToggleInputs(selectedServices)}
            <label class="check check-card"><span class="check-copy">배차 허용</span><input type="checkbox" data-field="dispatchEnabled" ${driver.dispatch_enabled ? 'checked' : ''} /></label>
            <input type="text" data-field="bankName" value="${escapeHtml(driver.bank_name || '')}" placeholder="은행명" />
            <input type="text" data-field="accountHolder" value="${escapeHtml(driver.account_holder || '')}" placeholder="예금주" />
            <input type="text" data-field="accountNumber" value="${escapeHtml(driver.account_number || '')}" placeholder="계좌번호" />
            <label class="check check-card"><span class="check-copy">정산 가능</span><input type="checkbox" data-field="payoutEnabled" ${driver.payout_enabled ? 'checked' : ''} /></label>
            <textarea data-field="payoutNote" placeholder="정산 메모">${escapeHtml(driver.payout_note || '')}</textarea>
            <input type="text" data-field="taxName" value="${escapeHtml(driver.tax_name || '')}" placeholder="세금 신고용 이름" />
            <label class="field-card date-field">
              <span class="field-title">생년월일</span>
              <span class="field-help">칸 아무 곳이나 눌러 날짜를 선택합니다.</span>
              <input type="date" data-field="taxBirthDate" value="${escapeHtml(driver.tax_birth_date || '')}" aria-label="생년월일" />
            </label>
            <input type="text" data-field="taxIdNumber" value="${escapeHtml(driver.tax_id_number || '')}" placeholder="주민등록번호 또는 사업자등록번호" />
            <input type="email" data-field="taxEmail" value="${escapeHtml(driver.tax_email || '')}" placeholder="세금 신고용 이메일" />
            <label class="check check-card"><span class="check-copy">3.3% 세금 정산 동의</span><input type="checkbox" data-field="taxWithholdingAgreed" ${driver.tax_withholding_agreed ? 'checked' : ''} /></label>
            <textarea data-field="taxAddress" placeholder="세금 신고용 주소">${escapeHtml(driver.tax_address || '')}</textarea>
            <textarea data-field="internalMemo" placeholder="기사 내부 메모">${escapeHtml(driver.internal_memo || '')}</textarea>
          </div>
          <div class="driver-actions">
            <button class="btn primary" data-action="save-driver">기사 정보 저장</button>
          </div>
        </div>
      </details>
    `;

      card.querySelector('[data-action="copy-join"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
        if (!driver.join_token) return showToast('기사 가입 토큰이 없어요.', 'error');
        const url = `${location.origin}/driver/join.html?token=${encodeURIComponent(driver.join_token)}`;
        await navigator.clipboard.writeText(url);
        showToast('기사 가입 링크를 복사했어요.');
      });

      card.querySelector('[data-action="copy-message"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
        if (!driver.join_token) return showToast('기사 가입 토큰이 없어요.', 'error');
        const url = `${location.origin}/driver/join.html?token=${encodeURIComponent(driver.join_token)}`;
        await navigator.clipboard.writeText(buildDriverJoinMessage(driver, url));
        showToast('기사 안내 문구를 복사했어요.');
      });

      card.querySelector('[data-action="copy-profile"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
        if (!driver.join_token) return showToast('기사 정보 관리 토큰이 없어요.', 'error');
        const url = `${location.origin}/driver/profile.html?token=${encodeURIComponent(driver.join_token)}`;
        await navigator.clipboard.writeText(url);
        showToast('기사 정보 관리 링크를 복사했어요.');
      });

      card.querySelector('[data-action="copy-profile-message"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
        if (!driver.join_token) return showToast('기사 정보 관리 토큰이 없어요.', 'error');
        const url = `${location.origin}/driver/profile.html?token=${encodeURIComponent(driver.join_token)}`;
        await navigator.clipboard.writeText(buildDriverProfileMessage(driver, url));
        showToast('기사 정보 관리 문구를 복사했어요.');
      });

      card.querySelector('[data-action="copy-guide"]').onclick = async (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
        const url = `${location.origin}/driver/guide.html`;
        await navigator.clipboard.writeText(buildDriverGuideMessage(url));
        showToast('기사 사용 안내 문구를 복사했어요.');
      });

      card.querySelector('[data-action="save-driver"]').onclick = async (e) => withButtonBusy(e.currentTarget, '저장 중...', async () => {
        const supportedServices = readSelectedServiceFields(card);
        if (!supportedServices.length) {
          showToast('지원 서비스는 하나 이상 선택해야 합니다.', 'error');
          return;
        }
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
          supportedServices,
          internalMemo: card.querySelector('[data-field="internalMemo"]').value
        };

        const saveRes = await adminFetch(api('update-driver-payout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const saveData = await saveRes.json();
        if (!saveData.success) return showToast(saveData.error || '기사 계좌 저장 실패', 'error');
        showToast('기사 정보를 저장했어요.');
        loadDrivers();
        loadSettlementDashboard();
      });

      list.appendChild(card);
    } catch (error) {
      console.warn('기사 카드 렌더링 실패', driver?.id, error);
      const fallback = document.createElement('div');
      fallback.className = 'mini-card muted';
      fallback.textContent = `${driver?.name || '기사'} 기사 정보를 화면에 그리지 못했어요. 새로고침 후 다시 확인해주세요.`;
      list.appendChild(fallback);
    }
  });
}

function renderSettlementSummary(summary = {}) {
  const summaryEl = document.getElementById('settlementSummary');
  const cards = document.getElementById('settlementCards');
  if (!summaryEl || !cards) return;
  summaryEl.textContent = `대기 실지급 ${money(summary.approvedNetAmount)} / 보류 실지급 ${money(summary.heldNetAmount)}`;
  cards.innerHTML = `
    <div class="summary-card">
      <div class="muted">지급 대기</div>
      <strong>${money(summary.approvedNetAmount)}</strong>
      <div class="row">총 ${money(summary.approvedAmount)} / 세금 ${money(summary.approvedWithholdingAmount)}</div>
      <div class="row">${Number(summary.approvedCount || 0)}건</div>
    </div>
    <div class="summary-card">
      <div class="muted">보류 중</div>
      <strong>${money(summary.heldNetAmount)}</strong>
      <div class="row">총 ${money(summary.heldAmount)} / 세금 ${money(summary.heldWithholdingAmount)}</div>
      <div class="row">${Number(summary.heldCount || 0)}건</div>
    </div>
    <div class="summary-card">
      <div class="muted">최근 지급 완료</div>
      <strong>${money(summary.paidNetAmount)}</strong>
      <div class="row">총 ${money(summary.paidAmount)} / 세금 ${money(summary.paidWithholdingAmount)}</div>
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
    showToast(data.error || '가격 대시보드 조회 실패', 'error');
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
  if (!confirm(`${periodKey} 기간 정산을 지급 완료로 처리할까요?\n이 작업은 되돌리기 어렵습니다.`)) return;
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
  if (!data.success) return showToast(data.error || '지급 완료 처리 실패', 'error');
  showToast(`지급 완료 처리 ${data.count || 0}건 / 총 ${money(data.totalAmount)} / 세금 ${money(data.totalWithholdingAmount)} / 실지급 ${money(data.totalNetAmount)}`);
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
    showToast(data.error || '정산 대시보드 조회 실패', 'error');
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
        <div class="price">${money(group.netAmount)}</div>
      </div>
      <div class="settlement-meta">
        <span class="pill ${group.payoutEnabled ? 'ok' : 'warn'}">${group.payoutEnabled ? '정산 가능' : '계좌 확인 필요'}</span>
        <span class="pill">${escapeHtml(group.bankName || '은행 미등록')}</span>
        <span class="pill mono">${escapeHtml(maskAccountNumber(group.accountNumber))}</span>
      </div>
      <div class="row" style="margin:8px 0 12px;">총 ${money(group.totalAmount)} / 3.3% ${money(group.withholdingAmount)} / 실지급 ${money(group.netAmount)}</div>
      <ul class="settlement-items">
        ${group.items.map((item) => `
          <li>
            <strong>${money(item.net_amount)}</strong>
            <div class="row">총 ${money(item.amount)} / 세금 ${money(item.withholding_amount)}</div>
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
      <strong>${escapeHtml(item.drivers?.name || '기사 미확인')} · 실지급 ${money(item.net_amount)}</strong>
      <div class="row">총 ${money(item.amount)} / 세금 ${money(item.withholding_amount)}</div>
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
      <strong>${escapeHtml(item.drivers?.name || '기사 미확인')} · 실지급 ${money(item.net_amount)}</strong>
      <div class="row">총 ${money(item.amount)} / 세금 ${money(item.withholding_amount)}</div>
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

function showDriverSummary(driver) {
  const body = document.getElementById('driverDetailBody');
  const dialog = document.getElementById('driverDetailDialog');
  if (!body || !dialog) return;
  body.innerHTML = renderDriverSummaryDetail(driver);
  dialog.showModal();
}

async function updateStatus(jobId, status, dispatchStatus, note) {
  const res = await adminFetch(api('update-job-status'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, status, dispatchStatus, note })
  });
  const data = await res.json();
  if (!data.success) showToast(data.error || '실패', 'error');
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
    return showToast(`${data.error || '배차 요청 실패'}${detail}`, 'error');
  }
  showToast(`배차 요청 완료: ${data.driver?.name || '-'}`);
  await loadAll();
}

async function cancelAssign(jobId) {
  const res = await adminFetch(api('cancel-assignment'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) {
    showToast(data.error || '취소 실패', 'error');
    return;
  }
  if (Number(data.canceledCount || 0) > 0) {
    showToast(`배차 요청 ${Number(data.canceledCount || 0)}건을 취소했습니다. 현재 상태는 ${data.dispatchStatus || 'idle'}입니다.`);
  } else {
    showToast(data.message || '취소할 배차 요청이 없어요.');
  }
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
  if (!token) return showToast('고객 완료 토큰이 없어요.', 'error');
  const url = `${location.origin}/customer/complete.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  showToast('고객 완료 링크를 복사했어요.');
}

async function copyCancelLink(jobId) {
  const res = await adminFetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_cancel_token;
  if (!token) return showToast('고객 취소 토큰이 없어요.', 'error');
  const url = `${location.origin}/customer/cancel.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  showToast('고객 취소 링크를 복사했어요.');
}

async function regenCustomerTokens(jobId) {
  if (!confirm('고객 완료/취소 링크를 새로 발급할까요?\n기존 링크는 더 이상 작동하지 않아요.')) return;
  const res = await adminFetch(api('regenerate-customer-tokens'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) return showToast(data.error || '토큰 재발급 실패', 'error');
  const completeUrl = `${location.origin}/customer/complete.html?token=${encodeURIComponent(data.customerCompleteToken)}`;
  const cancelUrl = `${location.origin}/customer/cancel.html?token=${encodeURIComponent(data.customerCancelToken)}`;
  await navigator.clipboard.writeText(`완료: ${completeUrl}\n취소: ${cancelUrl}`);
  showToast('토큰을 재발급하고 새 링크를 클립보드에 복사했어요.');
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
    try {
      await loadDrivers();
    } catch (error) {
      console.warn('기사 페이지 로드 실패', error);
      const list = document.getElementById('driverList');
      if (list) {
        list.innerHTML = `<div class="mini-card muted">기사 관리 화면을 불러오지 못했어요. 새로고침 후 다시 확인해주세요.<br />${escapeHtml(error?.message || '알 수 없는 오류')}</div>`;
      }
    }
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
    console.log('ADMIN_LOGIN_ATTEMPT', { tokenPreview: `${token.slice(0, 2)}***${token.slice(-2)}` });
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
    if (btn.dataset.status === currentFilter) btn.classList.add('active');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      currentPage = 0;
      try { localStorage.setItem(FILTER_KEY, currentFilter); } catch {}
      loadJobs();
    });
  });
  document.getElementById('btnRefresh')?.addEventListener('click', (e) => {
    withButtonBusy(e.currentTarget, '새로고침 중...', () => loadAll());
  });
  document.getElementById('btnCopyRecruitLink')?.addEventListener('click', (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
    const url = `${location.origin}/driver/apply.html`;
    await navigator.clipboard.writeText(url);
    showToast('신규 기사 모집 링크를 복사했어요.');
  }));
  document.getElementById('btnCopyRecruitMessage')?.addEventListener('click', (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
    const url = `${location.origin}/driver/apply.html`;
    await navigator.clipboard.writeText(buildDriverRecruitMessage(url));
    showToast('신규 기사 모집 문구를 복사했어요.');
  }));
  document.getElementById('btnCopyDriverGuideLink')?.addEventListener('click', (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
    const url = `${location.origin}/driver/guide.html`;
    await navigator.clipboard.writeText(url);
    showToast('기사 사용 안내 링크를 복사했어요.');
  }));
  document.getElementById('btnCopyDriverGuideMessage')?.addEventListener('click', (e) => withButtonBusy(e.currentTarget, '복사 중...', async () => {
    const url = `${location.origin}/driver/guide.html`;
    await navigator.clipboard.writeText(buildDriverGuideMessage(url));
    showToast('기사 사용 안내 문구를 복사했어요.');
  }));
  btnLogout?.addEventListener('click', () => {
    clearAdminToken();
    showAdminGate('로그아웃했어요.');
  });
  document.getElementById('btnAutoDispatch')?.addEventListener('click', async (e) => withButtonBusy(e.currentTarget, '재배차 중...', async () => {
    const res = await adminFetch(api('auto-dispatch'));
    const data = await res.json();
    showToast(`자동 재배차 처리: ${data.count || 0}건`);
    await loadAll();
  }));
  document.getElementById('btnCloseDialog')?.addEventListener('click', () => document.getElementById('detailDialog')?.close());
  document.getElementById('btnCloseDriverDialog')?.addEventListener('click', () => document.getElementById('driverDetailDialog')?.close());
  const marketingDateInput = document.querySelector('#marketingForm input[name="metricAt"]');
  if (marketingDateInput && !marketingDateInput.value) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    marketingDateInput.value = local;
  }

  const manualForm = document.getElementById('manualOrderForm');
  const manualTextEl = document.getElementById('manualOrderText');
  const manualStatusEl = document.getElementById('manualOrderStatus');
  const manualPreviewEl = document.getElementById('manualOrderPreview');
  const manualCreateBtn = document.getElementById('btnCreateManualOrder');
  const manualCopyPayLinkBtn = document.getElementById('btnCopyManualPayLink');
  const renderManualState = (message = '문자 주문서를 붙여넣으면 같은 주문 흐름으로 등록할 수 있어요.') => {
    if (manualStatusEl) manualStatusEl.textContent = message;
    if (manualPreviewEl) {
      manualPreviewEl.classList.toggle('is-ready', Boolean(manualOrderDraft));
      manualPreviewEl.innerHTML = renderManualOrderPreview(manualOrderDraft?.preview, manualOrderDraft?.paymentUrl || '');
    }
    if (manualCreateBtn) manualCreateBtn.disabled = !manualOrderDraft?.payload;
    if (manualCopyPayLinkBtn) manualCopyPayLinkBtn.disabled = !manualOrderDraft?.paymentUrl;
  };

  document.getElementById('btnParseManualOrder')?.addEventListener('click', async (e) => {
    await withButtonBusy(e.currentTarget, '파싱 중...', async () => {
      try {
        manualOrderDraft = null;
        const parsed = parseInquiryTextToPayload(
          document.getElementById('manualOrderText')?.value || '',
          document.getElementById('manualCustomerName')?.value || '',
          document.getElementById('manualCustomerPhone')?.value || '',
          document.getElementById('manualServiceType')?.value || ''
        );
        manualOrderDraft = parsed;
        renderManualState('주문서 파싱이 끝났어요. 확인 후 주문 생성으로 넘기면 됩니다.');
      } catch (error) {
        renderManualState(error.message || '주문서 파싱에 실패했어요.');
      }
    });
  });

  manualForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!manualOrderDraft?.payload) {
      renderManualState('먼저 주문서를 파싱해주세요.');
      return;
    }
    const submitButton = e.target.querySelector('#btnCreateManualOrder');
    await withButtonBusy(submitButton, '생성 중...', async () => {
      const res = await adminFetch(api('create-job'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualOrderDraft.payload)
      });
      const data = await res.json();
      if (!data.job?.id) {
        renderManualState(data.error || '주문 생성에 실패했어요.');
        return;
      }
      const paymentUrl = `${location.origin}/customer/pay.html?jobId=${encodeURIComponent(data.job.id)}`;
      manualOrderDraft = { jobId: data.job.id, paymentUrl, payload: null, preview: null };
      if (manualTextEl) manualTextEl.value = '';
      const nameEl = document.getElementById('manualCustomerName');
      const phoneEl = document.getElementById('manualCustomerPhone');
      const serviceTypeEl = document.getElementById('manualServiceType');
      if (nameEl) nameEl.value = '';
      if (phoneEl) phoneEl.value = '';
      if (serviceTypeEl) serviceTypeEl.value = '';
      renderManualState(`주문이 등록됐어요. 결제 링크를 고객에게 보내면 됩니다. 총 결제는 ${money(data.job.total_price)}입니다.`);
      await loadAll();
    });
  });

  manualCopyPayLinkBtn?.addEventListener('click', async (e) => {
    await withButtonBusy(e.currentTarget, '복사 중...', async () => {
      if (!manualOrderDraft?.paymentUrl) {
        renderManualState('먼저 주문을 만든 뒤 결제 링크를 복사해주세요.');
        return;
      }
      await navigator.clipboard.writeText(manualOrderDraft.paymentUrl);
      renderManualState('결제 링크를 복사했어요. 고객에게 그대로 보내면 됩니다.');
    });
  });

  manualTextEl?.addEventListener('input', () => {
    manualOrderDraft = null;
    renderManualState('주문서 내용이 바뀌었어요. 다시 파싱해주세요.');
  });
  document.getElementById('manualCustomerName')?.addEventListener('input', () => {
    manualOrderDraft = null;
    renderManualState('고객 정보가 바뀌었어요. 다시 파싱해주세요.');
  });
  document.getElementById('manualCustomerPhone')?.addEventListener('input', () => {
    manualOrderDraft = null;
    renderManualState('고객 정보가 바뀌었어요. 다시 파싱해주세요.');
  });
  document.getElementById('manualServiceType')?.addEventListener('change', () => {
    manualOrderDraft = null;
    renderManualState('서비스가 바뀌었어요. 다시 파싱해주세요.');
  });
  renderManualState();

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
      if (!data.success) return showToast(data.error || '광고 데이터 저장 실패', 'error');
      showToast('광고 데이터를 저장했어요.');
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
    if (!data.success) return showToast(data.error || '배율 재계산 실패', 'error');
    showToast(`배율을 ${Number(data.recommendation?.nextMultiplier || 0).toFixed(3)}로 계산했어요.`);
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
