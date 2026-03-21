const statReservations = document.getElementById('statReservations');
const statDispatches = document.getElementById('statDispatches');
const statEta = document.getElementById('statEta');

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

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
});
