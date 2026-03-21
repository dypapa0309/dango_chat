import { json } from '../../shared/http.js';
import { fetchGaRealtime } from '../../shared/ga.js';

export async function handler() {
  try {
    const data = await fetchGaRealtime();
    return json(
      { ok: true, ...data },
      200,
      { 'Cache-Control': 'public, max-age=30, s-maxage=30' }
    );
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500);
  }
}
