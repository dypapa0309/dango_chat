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

function initReveal() {
  const blockSelectors = [
    '.hero-copy',
    '.hero-panel',
    '.quick-band-card',
    '.section-surface',
    '.driver-proof-shell .section-head',
    '.faq-shell',
    '.final-cta',
    '.footer-service-card',
    '.biz-footer'
  ];

  const staggerSelectors = [
    '.stats-grid',
    '.quick-tags',
    '.trust-strip',
    '.flow-grid',
    '.driver-proof-grid',
    '.trust-grid',
    '.faq-list'
  ];

  const blockElements = blockSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
  const staggerElements = staggerSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));

  const targets = [
    ...blockElements.map((element) => ({ element, className: 'reveal-block' })),
    ...staggerElements.map((element) => ({ element, className: 'reveal-stagger' }))
  ];

  if (!targets.length) return;

  targets.forEach(({ element, className }) => {
    element.classList.add(className);
  });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(({ element }) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: '0px 0px -10% 0px'
  });

  targets.forEach(({ element }) => observer.observe(element));
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
  initReveal();
});
