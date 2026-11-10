'use client';
import { useEffect, useState } from 'react';
import { useMe } from '@/lib/useMe';
export default function MyMandiPage() {
  const me = useMe(); const [m, setM] = useState(null); const [msg, setMsg] = useState(null);
  useEffect(() => { fetch('/api/my-mandi').then((r) => r.json()).then(setM); }, []);
  if (!m) return <p>Loading...</p>;
  const admin = me?.role === 'MandiAdmin'; const set = (k) => (e) => setM({ ...m, [k]: e.target.value });
  async function save(e) {
    e.preventDefault();
    const r = await fetch('/api/my-mandi', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: m.name, location: m.location, latitude: m.latitude, longitude: m.longitude }) });
    const d = await r.json(); setMsg(r.ok ? { ok: true, text: 'Saved' } : { ok: false, text: d.error });
  }
  return <form className='card' onSubmit={save}><h1>My mandi</h1>
    {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
    <div className='grid'>
      <label>Name<input value={m.name ?? ''} onChange={set('name')} disabled={!admin} /></label>
      <label>Location (district)<input value={m.location ?? ''} onChange={set('location')} disabled={!admin} /></label>
      <label>Latitude<input type='number' step='any' value={m.latitude ?? ''} onChange={set('latitude')} disabled={!admin} /></label>
      <label>Longitude<input type='number' step='any' value={m.longitude ?? ''} onChange={set('longitude')} disabled={!admin} /></label>
    </div>
    <p className='hint'>{m.sales_count} sales, total Rs {Number(m.total_sales).toLocaleString('en-IN')}, {m.price_records} price records.</p>
    {admin && <button type='submit'>Save</button>}
  </form>;
}
