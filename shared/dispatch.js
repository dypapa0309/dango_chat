function toRad(v) {
  return (v * Math.PI) / 180;
}

function isValidCoord(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  return Number.isFinite(la) && Number.isFinite(lo) && la !== 0 && lo !== 0 && la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
}

export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  if (!isValidCoord(lat1, lng1) || !isValidCoord(lat2, lng2)) return Infinity;
  const a1 = Number(lat1);
  const o1 = Number(lng1);
  const a2 = Number(lat2);
  const o2 = Number(lng2);
  const R = 6371;
  const dLat = toRad(a2 - a1);
  const dLon = toRad(o2 - o1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function scoreDriver(job, driver) {
  const distance = haversineDistanceKm(job.start_lat, job.start_lng, driver.current_lat, driver.current_lng);
  const rating = Number(driver.rating || 5);
  const acceptanceRate = Number(driver.acceptance_rate || 0);
  const responseScore = Number(driver.response_score || 0);
  const completedJobs = Number(driver.completed_jobs || 0);

  let score = 0;
  score += Math.max(0, 50 - distance) * 2;
  score += rating * 10;
  score += acceptanceRate * 0.2;
  score += responseScore * 0.15;
  score += Math.min(completedJobs, 30) * 0.2;

  return {
    ...driver,
    distance_km: Number(distance.toFixed(2)),
    dispatch_score: Number(score.toFixed(2))
  };
}

export function rankDrivers(job, drivers = []) {
  return [...drivers]
    .filter((driver) => driver.status === 'active' && driver.dispatch_enabled)
    .map((driver) => scoreDriver(job, driver))
    .sort((a, b) => b.dispatch_score - a.dispatch_score);
}

export function dispatchMessage({ job, driver, token, siteUrl }) {
  const baseUrl = (siteUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/driver/accept.html?token=${encodeURIComponent(token)}`;
  return `[당고 배차 요청]\n날짜: ${job.move_date || '-'}\n출발: ${job.start_address || '-'}\n도착: ${job.end_address || '-'}\n운임: ${Number(job.total_price || 0).toLocaleString()}원\n기사: ${driver.name || '-'}\n아래 링크에서 배차 수락/거절해주세요:\n${url}`;
}
