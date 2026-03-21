const statReservations = document.getElementById('statReservations');
const statDispatches = document.getElementById('statDispatches');
const statEta = document.getElementById('statEta');
const ATTR_KEY = 'dango:attribution';

function formatStat(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '집계중';
  return `${Number(value).toLocaleString()}${suffix}`;
}

async function loadStats() {
  try {
    const res = await fetch('/.netlify/functions/get-stats');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'stats failed');
    statReservations.textContent = formatStat(data.todayReservations, '건');
    statDispatches.textContent = formatStat(data.activeDispatches, '건');
    statEta.textContent = data.gaAvailable
      ? formatStat(data.liveUsers, '명')
      : formatStat(data.averageEtaMinutes, '분');
  } catch {
    statReservations.textContent = '집계중';
    statDispatches.textContent = '집계중';
    statEta.textContent = '집계중';
  }
}

function captureAttribution() {
  const qs = new URLSearchParams(location.search);
  const source = qs.get('utm_source') || qs.get('source') || qs.get('channel');
  const medium = qs.get('utm_medium') || null;
  const campaign = qs.get('utm_campaign') || null;

  if (!source && !medium && !campaign) return;

  localStorage.setItem(ATTR_KEY, JSON.stringify({
    source: source || 'direct',
    medium,
    campaign,
    capturedAt: new Date().toISOString()
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  captureAttribution();
  loadStats();
});
