const statReservations = document.getElementById('statReservations');
const statDispatches = document.getElementById('statDispatches');
const statEta = document.getElementById('statEta');

function formatStat(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '집계중';
  return `${Number(value).toLocaleString()}${suffix}`;
}

function createGaFloatingBadge() {
  if (document.getElementById('gaFloatingBadge')) return null;

  const badge = document.createElement('aside');
  badge.id = 'gaFloatingBadge';
  badge.className = 'ga-floating-badge';
  badge.innerHTML = `
    <div class="ga-floating-badge__eyebrow">
      <span class="ga-floating-badge__dot" aria-hidden="true"></span>
      <span>실시간 이용 현황</span>
    </div>
    <div class="ga-floating-badge__hero-main">
      <strong class="ga-floating-badge__value" data-ga-active>0</strong>
      <span class="ga-floating-badge__unit">명</span>
    </div>
    <div class="ga-floating-badge__hero-copy" data-ga-copy>지금 0명이 견적 확인 중</div>
    <div class="ga-floating-badge__desc" data-ga-desc>GA 실시간 데이터를 불러오는 중입니다</div>
    <div class="ga-floating-badge__stats">
      <div class="ga-floating-badge__stat">
        <span class="ga-floating-badge__stat-label">최근 30분 조회</span>
        <strong class="ga-floating-badge__stat-value" data-ga-secondary>-</strong>
      </div>
      <div class="ga-floating-badge__stat">
        <span class="ga-floating-badge__stat-label">업데이트</span>
        <strong class="ga-floating-badge__stat-value" data-ga-time>-</strong>
      </div>
    </div>
  `;

  document.body.appendChild(badge);
  return badge;
}

async function loadStats() {
  const badge = createGaFloatingBadge();
  try {
    const res = await fetch('/.netlify/functions/get-stats');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'stats failed');
    statReservations.textContent = formatStat(data.todayReservations, '건');
    statDispatches.textContent = formatStat(data.activeDispatches, '건');
    statEta.textContent = data.gaAvailable
      ? formatStat(data.liveUsers, '명')
      : formatStat(data.averageEtaMinutes, '분');

    if (badge) {
      badge.querySelector('[data-ga-active]').textContent = Number(data.liveUsers || 0).toLocaleString();
      badge.querySelector('[data-ga-copy]').textContent = `지금 ${Number(data.liveUsers || 0).toLocaleString()}명이 견적 확인 중`;
      badge.querySelector('[data-ga-desc]').textContent = data.gaAvailable
        ? '실시간 방문 흐름이 반영되고 있어요'
        : 'GA 실시간 연결을 기다리는 중입니다';
      badge.querySelector('[data-ga-secondary]').textContent = data.recentPageViews != null
        ? Number(data.recentPageViews).toLocaleString()
        : '-';
      badge.querySelector('[data-ga-time]').textContent = data.fetchedAtKst || '-';
    }
  } catch {
    statReservations.textContent = '집계중';
    statDispatches.textContent = '집계중';
    statEta.textContent = '집계중';
    if (badge) {
      badge.querySelector('[data-ga-copy]').textContent = '실시간 데이터를 불러오지 못했습니다';
      badge.querySelector('[data-ga-desc]').textContent = '환경변수 또는 함수 연결 상태를 확인해주세요';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
});
