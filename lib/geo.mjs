
 // lib/geo.mjs
// Map service helpers. A point is { lat, lng }.
// OpenRouteService expects longitude first.

const base = () => {
  const b = process.env.ORS_BASE_URL ?? 'https://api.openrouteservice.org';
  return b.endsWith('/') ? b.slice(0, -1) : b;
};

const key = () => process.env.ORS_API_KEY;

export function haversineKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) *
    Math.cos(rad(b.lat)) *
    Math.sin(dLng / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function timedFetch(url, options = {}, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);

  try {
    return await fetch(url, { ...options, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

const post = (body, ms) =>
  timedFetch(`${base()}/v2/matrix/driving-car`, {
    method: 'POST',
    headers: {
      Authorization: key(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, ms);

// Place name to { lat, lng }, or null if it cannot be found.
export async function geocode(place) {
  if (!key()) return null;

  try {
    const url =
      `${base()}/geocode/search?api_key=${encodeURIComponent(key())}` +
      `&text=${encodeURIComponent(place)}&boundary.country=IN&size=1`;

    const res = await timedFetch(url);
    if (!res.ok) return null;

    const body = await res.json();
    const c = body.features?.[0]?.geometry?.coordinates;

    return c ? { lat: c[1], lng: c[0] } : null;
  } catch {
    return null;
  }
}

// Driving distance in km from one origin to each destination.
export async function roadDistancesKm(origin, dests) {
  const estimate = () =>
    dests.map((d) =>
      Math.round(haversineKm(origin, d) * 1.25 * 10) / 10
    );

  if (!key() || dests.length === 0) {
    return { km: estimate(), mapped: false };
  }

  try {
    const res = await post({
      locations: [
        [origin.lng, origin.lat],
        ...dests.map((d) => [d.lng, d.lat]),
      ],
      sources: [0],
      destinations: dests.map((_, i) => i + 1),
      metrics: ['distance'],
      units: 'km',
    });

    if (!res.ok) return { km: estimate(), mapped: false };

    const row = (await res.json()).distances?.[0];

    if (!row || row.some((v) => v === null || !Number.isFinite(v))) {
      return { km: estimate(), mapped: false };
    }

    return {
      km: row.map((v) => Math.round(v * 10) / 10),
      mapped: true,
    };
  } catch {
    return { km: estimate(), mapped: false };
  }
}

// All-pairs driving distances for the road builder.
export async function roadMatrixKm(points) {
  const estimate = () =>
    points.map((a) =>
      points.map((b) =>
        Math.round(haversineKm(a, b) * 1.25 * 10) / 10
      )
    );

  if (!key()) return { matrix: estimate(), mapped: false };

  try {
    const res = await post({
      locations: points.map((p) => [p.lng, p.lat]),
      metrics: ['distance'],
      units: 'km',
    }, 20000);

    if (!res.ok) return { matrix: estimate(), mapped: false };

    const m = (await res.json()).distances;

    if (!m || m.some((row) =>
      row.some((v) => v === null || !Number.isFinite(v))
    )) {
      return { matrix: estimate(), mapped: false };
    }

    return { matrix: m, mapped: true };
  } catch {
    return { matrix: estimate(), mapped: false };
  }
}

// Find the k mandis closest in a straight line.
export function nearestMandis(point, mandis, k = 3) {
  return mandis
    .filter((m) => m.latitude !== null && m.longitude !== null)
    .map((m) => ({
      ...m,
      lat: Number(m.latitude),
      lng: Number(m.longitude),
    }))
    .map((m) => ({ ...m, straight: haversineKm(point, m) }))
    .sort((a, b) => a.straight - b.straight)
    .slice(0, k);
}
