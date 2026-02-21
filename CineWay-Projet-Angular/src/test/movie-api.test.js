import { describe, it, expect } from 'vitest';
import { environment } from '../environments/environment';
const BASE = environment.apiUrl; 
async function getJson(url) {
  const res = await fetch(url);
  const text = await res.text();

  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    console.log('HTTP', res.status, url, data);
  }

  return { res, data };
}

describe('Movies endpoints (integration, real HTTP)', () => {
  it('GET /movies/ should return an array', async () => {
    const { res, data } = await getJson(`${BASE}/movies/`);

    expect(res.status).toBe(200);
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('GET /movies/99999 should return 404 (nonexistent)', async () => {
    const { res } = await getJson(`${BASE}/movies/99999`);

    expect(res.status).toBe(404);
  });

 
});