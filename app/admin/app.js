let currentFilter = 'all';

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

async function loadJobs() {
  const res = await fetch(`${api('get-jobs')}?status=${encodeURIComponent(currentFilter)}`);
  const data = await res.json();
  const jobs = data.jobs || [];
  document.getElementById('jobCount').textContent = `${jobs.length}건`;
  const list = document.getElementById('jobList');
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
        <button class="btn primary" data-action="confirm">예약 확정</button>
        <button class="btn primary" data-action="assign">배차 요청</button>
        <button class="btn danger" data-action="cancel">요청 취소</button>
        <button class="btn" data-action="complete">예외 완료</button>
        <button class="btn" data-action="complete-link">완료 링크</button>
        <button class="btn" data-action="cancel-link">취소 링크</button>
        <button class="btn" data-action="paylink">결제 링크</button>
      </div>
    `;
    card.querySelector('[data-action="detail"]').onclick = () => showDetail(job.id);
    card.querySelector('[data-action="confirm"]').onclick = () => updateStatus(job.id, 'confirmed', 'idle', '관리자 확정');
    card.querySelector('[data-action="assign"]').onclick = () => requestAssign(job.id);
    card.querySelector('[data-action="cancel"]').onclick = () => cancelAssign(job.id);
    card.querySelector('[data-action="complete"]').onclick = () => completeJob(job.id);
    card.querySelector('[data-action="complete-link"]').onclick = async () => copyCompleteLink(job.id);
    card.querySelector('[data-action="cancel-link"]').onclick = async () => copyCancelLink(job.id);
    card.querySelector('[data-action="paylink"]').onclick = () => {
      location.href = `/customer/pay.html?jobId=${encodeURIComponent(job.id)}`;
    };
    list.appendChild(card);
  });
}

async function loadDrivers() {
  const res = await fetch(api('get-drivers'));
  const data = await res.json();
  const drivers = data.drivers || [];
  document.getElementById('driverCount').textContent = `${drivers.length}명`;
  const list = document.getElementById('driverList');
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
          <span class="pill">${escapeHtml(driver.status || '-')}</span>
        </div>
      </div>
      <div class="driver-grid">
        <input type="text" data-field="bankName" value="${escapeHtml(driver.bank_name || '')}" placeholder="은행명" />
        <input type="text" data-field="accountHolder" value="${escapeHtml(driver.account_holder || '')}" placeholder="예금주" />
        <input type="text" data-field="accountNumber" value="${escapeHtml(driver.account_number || '')}" placeholder="계좌번호" />
        <label class="check"><input type="checkbox" data-field="payoutEnabled" ${driver.payout_enabled ? 'checked' : ''} /> 정산 가능</label>
        <textarea data-field="payoutNote" placeholder="정산 메모">${escapeHtml(driver.payout_note || '')}</textarea>
      </div>
      <div class="driver-actions">
        <button class="btn primary" data-action="save-driver">계좌 저장</button>
      </div>
    `;

    card.querySelector('[data-action="save-driver"]').onclick = async () => {
      const payload = {
        driverId: driver.id,
        bankName: card.querySelector('[data-field="bankName"]').value,
        accountHolder: card.querySelector('[data-field="accountHolder"]').value,
        accountNumber: card.querySelector('[data-field="accountNumber"]').value,
        payoutEnabled: card.querySelector('[data-field="payoutEnabled"]').checked,
        payoutNote: card.querySelector('[data-field="payoutNote"]').value
      };

      const saveRes = await fetch(api('update-driver-payout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const saveData = await saveRes.json();
      if (!saveData.success) return alert(saveData.error || '기사 계좌 저장 실패');
      alert('기사 계좌 정보를 저장했어요.');
      loadSettlementDashboard();
    };

    list.appendChild(card);
  });
}

function renderSettlementSummary(summary = {}) {
  document.getElementById('settlementSummary').textContent = `대기 ${money(summary.approvedAmount)} / 보류 ${money(summary.heldAmount)}`;
  const cards = document.getElementById('settlementCards');
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

async function markSettlementsPaid(driverId, periodKey) {
  const paidBy = prompt('누가 이체했는지 적어주세요.', '운영자');
  if (paidBy === null) return;
  const memo = prompt('메모가 있으면 적어주세요.', '수동 이체 완료');
  if (memo === null) return;

  const res = await fetch(api('mark-settlements-paid'), {
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
  const res = await fetch(api('get-settlement-dashboard'));
  const data = await res.json();
  if (!data.success) {
    alert(data.error || '정산 대시보드 조회 실패');
    return;
  }

  renderSettlementSummary(data.summary);

  const groupsEl = document.getElementById('settlementGroups');
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

    card.querySelector('[data-action="paid"]').onclick = () => markSettlementsPaid(group.driverId, group.periodKey);
    groupsEl.appendChild(card);
  });

  if (!groupsEl.innerHTML.trim()) {
    groupsEl.innerHTML = '<div class="mini-card muted">지급 대기 중인 2주 정산 묶음이 없어요.</div>';
  }

  const heldEl = document.getElementById('heldSettlementList');
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

  const paidEl = document.getElementById('paidSettlementList');
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
  const res = await fetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  document.getElementById('detailBody').innerHTML = `<pre class="codebox">${escapeHtml(JSON.stringify(data.job, null, 2))}</pre>`;
  document.getElementById('detailDialog').showModal();
}

async function updateStatus(jobId, status, dispatchStatus, note) {
  const res = await fetch(api('update-job-status'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, status, dispatchStatus, note })
  });
  const data = await res.json();
  if (!data.success) alert(data.error || '실패');
  await loadAll();
}

async function requestAssign(jobId) {
  const res = await fetch(api('assign-request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) return alert(data.error || '배차 요청 실패');
  alert(`배차 요청 완료: ${data.driver?.name || '-'}`);
  await loadAll();
}

async function cancelAssign(jobId) {
  const res = await fetch(api('cancel-assignment'), {
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
  await fetch(api('createSettlement'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  await loadAll();
}

async function copyCompleteLink(jobId) {
  const res = await fetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_complete_token;
  if (!token) return alert('고객 완료 토큰이 없어요.');
  const url = `${location.origin}/customer/complete.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  alert('고객 완료 링크를 복사했어요.');
}

async function copyCancelLink(jobId) {
  const res = await fetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_cancel_token;
  if (!token) return alert('고객 취소 토큰이 없어요.');
  const url = `${location.origin}/customer/cancel.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  alert('고객 취소 링크를 복사했어요.');
}

async function loadAll() {
  await Promise.all([loadJobs(), loadDrivers(), loadSettlementDashboard()]);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      loadJobs();
    });
  });

  document.getElementById('btnRefresh').onclick = loadAll;
  document.getElementById('btnAutoDispatch').onclick = async () => {
    const res = await fetch(api('auto-dispatch'));
    const data = await res.json();
    alert(`자동 재배차 처리: ${data.count || 0}건`);
    await loadAll();
  };
  document.getElementById('btnCloseDialog').onclick = () => document.getElementById('detailDialog').close();

  document.getElementById('quickForm').addEventListener('submit', async (e) => {
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

    const res = await fetch(api('create-job'), {
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

  setTimeout(loadAll, 200);
});
