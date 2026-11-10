'use client';
import { useEffect, useState } from 'react';
export default function MyWarehousePage() {
  const [w, setW] = useState(null); const [msg, setMsg] = useState(null);
  useEffect(() => { fetch('/api/my-warehouse').then((r) => r.json()).then(setW); }, []);
  if (!w) return <p>Loading...</p>;
  const set = (k) => (e) => setW({ ...w, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    const r = await fetch('/api/my-warehouse', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: w.location, capacity: w.capacity }) });
    const d = await r.json(); setMsg(r.ok ? { ok: true, text: 'Saved' } : { ok: false, text: d.error });
  }
  return <form className='card' onSubmit={save}><h1>My warehouse</h1>
    {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
    <div className='grid'>
      <label>Location<input value={w.location ?? ''} onChange={set('location')} /></label>
      <label>Capacity (quintals)<input type='number' step='any' value={w.capacity ?? ''} onChange={set('capacity')} /></label>
    </div>
    <p className='hint'>{w.batch_total} quintals stored in {w.batches} batches ({w.utilization_pct}% full).</p>
    <button type='submit'>Save</button>
  </form>;
}
