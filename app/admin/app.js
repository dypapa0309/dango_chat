let currentFilter = 'all';
const money = (n) => `${Number(n || 0).toLocaleString()}원`;
const api = (name) => `${window.dd.apiBase}/${name}`;

function escapeHtml(str) {
  return String(str).replace(/[&<>\"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
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

async function showDetail(jobId) {
  const res = await fetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  document.getElementById('detailBody').innerHTML = `<pre class="codebox">${escapeHtml(JSON.stringify(data.job, null, 2))}</pre>`;
  document.getElementById('detailDialog').showModal();
}

async function updateStatus(jobId, status, dispatchStatus, note) {
  const res = await fetch(api('update-job-status'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, status, dispatchStatus, note })
  });
  const data = await res.json();
  if (!data.success) alert(data.error || '실패');
  loadJobs();
}

async function requestAssign(jobId) {
  const res = await fetch(api('assign-request'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) return alert(data.error || '배차 요청 실패');
  alert(`배차 요청 완료: ${data.driver?.name || '-'}`);
  loadJobs();
}

async function cancelAssign(jobId) {
  const res = await fetch(api('cancel-assignment'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
  const data = await res.json();
  if (!data.success) alert(data.error || '취소 실패');
  loadJobs();
}

async function completeJob(jobId) {
  await updateStatus(jobId, 'completed', 'completed', '관리자 예외 완료');
  await fetch(api('createSettlement'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
}

async function copyCompleteLink(jobId) {
  const res = await fetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_complete_token;
  if (!token) return alert('고객 완료 토큰이 없습니다.');
  const url = `${location.origin}/customer/complete.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  alert('고객 완료 링크를 복사했습니다.');
}

async function copyCancelLink(jobId) {
  const res = await fetch(`${api('get-job-detail')}?jobId=${encodeURIComponent(jobId)}`);
  const data = await res.json();
  const token = data.job?.customer_cancel_token;
  if (!token) return alert('고객 취소 토큰이 없습니다.');
  const url = `${location.origin}/customer/cancel.html?token=${encodeURIComponent(token)}`;
  await navigator.clipboard.writeText(url);
  alert('고객 취소 링크를 복사했습니다.');
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

  document.getElementById('btnRefresh').onclick = loadJobs;
  document.getElementById('btnAutoDispatch').onclick = async () => {
    const res = await fetch(api('auto-dispatch'));
    const data = await res.json();
    alert(`자동 재배차 처리: ${data.count || 0}건`);
    loadJobs();
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) return alert(data.error || '주문 생성 실패');
    alert(`주문 생성 완료 / 총액 ${money(data.job.total_price)}`);
    e.target.reset();
    loadJobs();
  });

  setTimeout(loadJobs, 200);
});
