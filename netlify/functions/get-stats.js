import { adminClient } from '../../shared/db.js';
import { ok } from '../../shared/http.js';
import { fetchGaRealtime, getKstDayRange, hasGaRealtimeConfig } from '../../shared/ga.js';

export async function handler() {
  const stats = {
    todayReservations: 0,
    activeDispatches: 0,
    averageEtaMinutes: null,
    liveUsers: null,
    recentPageViews: null,
    fetchedAtKst: null,
    gaAvailable: false
  };

  try {
    const supabase = adminClient();
    const { start, end } = getKstDayRange();

    const [{ count: reservationCount }, { count: dispatchCount }, etaResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end),
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .in('dispatch_status', ['requesting', 'assigned']),
      supabase
        .from('assignments')
        .select('created_at, responded_at, status')
        .eq('status', 'accepted')
        .not('responded_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const etaSamples = (etaResult.data || [])
      .map((row) => {
        const startedAt = new Date(row.created_at).getTime();
        const respondedAt = new Date(row.responded_at).getTime();
        if (!startedAt || !respondedAt || respondedAt < startedAt) return null;
        return Math.round((respondedAt - startedAt) / 60000);
      })
      .filter((value) => Number.isFinite(value));

    const averageEtaMinutes = etaSamples.length
      ? Math.max(1, Math.round(etaSamples.reduce((sum, value) => sum + value, 0) / etaSamples.length))
      : null;

    stats.todayReservations = Number(reservationCount || 0);
    stats.activeDispatches = Number(dispatchCount || 0);
    stats.averageEtaMinutes = averageEtaMinutes;
  } catch {}

  if (hasGaRealtimeConfig()) {
    try {
      const ga = await fetchGaRealtime();
      stats.liveUsers = ga.activeUsers;
      stats.recentPageViews = ga.screenPageViews;
      stats.fetchedAtKst = ga.fetchedAtKst;
      stats.gaAvailable = true;
    } catch {}
  }

  return ok(stats);
}
