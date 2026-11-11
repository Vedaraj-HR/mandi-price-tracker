
// scripts/agmarknet-client.mjs
// Downloads and cleans records from the data.gov.in mandi price feed

const BASE =
  'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

function pick(rec, names) {
  for (const n of names) {
    if (rec[n] !== undefined && rec[n] !== null && rec[n] !== '') {
      return rec[n];
    }
  }
  return null;
}

// Accepts 31/10/2026 or 2026-10-31 and returns 2026-10-31
function toIsoDate(s) {
  if (!s) return null;

  const t = String(s).trim();

  let m = new RegExp(
    '^([0-9]{2})[/-]([0-9]{2})[/-]([0-9]{4})$'
  ).exec(t);

  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  m = new RegExp(
    '^([0-9]{4})-([0-9]{2})-([0-9]{2})'
  ).exec(t);

  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function normalize(r) {
  return {
    state: pick(r, ['state', 'State']),
    district: pick(r, ['district', 'District']),
    market: pick(r, ['market', 'Market']),
    commodity: pick(r, ['commodity', 'Commodity']),
    variety: pick(r, ['variety', 'Variety']),
    date: toIsoDate(pick(r, ['arrival_date', 'Arrival_Date'])),
    min: num(pick(r, ['min_price', 'Min_x0020_Price'])),
    max: num(pick(r, ['max_price', 'Max_x0020_Price'])),
    modal: num(pick(r, ['modal_price', 'Modal_x0020_Price'])),
  };
}

// Example filters: { state: 'Karnataka', commodity: 'Tomato' }
export async function fetchAll(filters, maxRecords = 5000) {
  const key = process.env.DATA_GOV_API_KEY;

  if (!key) {
    throw new Error('Set DATA_GOV_API_KEY in .env.local');
  }

  const out = [];
  const limit = 500;
  let offset = 0;

  while (out.length < maxRecords) {
    const p = new URLSearchParams({
      'api-key': key,
      format: 'json',
      offset: String(offset),
      limit: String(limit),
    });

    for (const [k, v] of Object.entries(filters)) {
      p.set(`filters[${k}]`, v);
    }

    const res = await fetch(`${BASE}?${p}`);

    if (!res.ok) {
      throw new Error(
        `API error ${res.status}: ${(await res.text()).slice(0, 200)}`
      );
    }

    const body = await res.json();
    const recs = body.records ?? [];

    out.push(...recs);

    if (recs.length < limit) break;

    offset += limit;
  }

  return out.map(normalize);
}
