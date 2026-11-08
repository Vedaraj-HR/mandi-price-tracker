'use client';
// app/recommend/page.js
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';


export default function RecommendPage() {
  const [mandis, setMandis] = useState([]);
  const [crops, setCrops] = useState([]);
  const [from, setFrom] = useState('');
  const [crop, setCrop] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/mandis').then((r) => r.json()).then((d) => Array.isArray(d) && setMandis(d));
    fetch('/api/crops').then((r) => r.json()).then((d) => Array.isArray(d) && setCrops(d));
  }, []);


  async function go() {
    setError('');
    const r = await fetch(`/api/recommend?from=${from}&crop=${crop}`);
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setRows(d);
  }

  return (
    <div>
      <h1>Where should I sell?</h1>
      <p className='hint'>Net return = latest modal price minus the cheapest transport cost (Rs per quintal).</p>
      <div className='card'>
        <div className='grid'>
          <label>My mandi
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              <option value=''>-- choose --</option>
              {mandis.map((m) => <option key={m.mandi_id} value={m.mandi_id}>{m.name}</option>)}
            </select>
          </label>
          <label>Crop
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value=''>-- choose --</option>
              {crops.map((c) => <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>)}
            </select>
          </label>
        </div>
        <button disabled={!from || !crop} onClick={go}>Recommend</button>
      </div>
      {error && <p className='err'>{error}</p>}
      {rows && rows.length > 0 && <p className='ok'>Best choice: {rows[0].mandi}, net Rs {rows[0].net_return} per quintal.</p>}
      {rows && <DataTable rows={rows} highlightFirst />}
    </div>
  );
}
