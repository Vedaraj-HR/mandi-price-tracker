'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';

const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
function Summary({ s }) {
  if (!s) return null;
  return <>
    <p>Value if sold today: <b>Rs {s.value_if_sold_today}</b>. Best day to sell: <b>{s.best_day_to_sell}</b>
      (Rs {s.value_on_best_day}). Days left before it is fully spoiled: <b>{s.days_left_before_spoiled}</b>.</p>
    <p className='err'>If you keep waiting until the end you lose about Rs {s.loss_if_you_wait_until_the_end} compared with selling today.</p>
    <details><summary>Day by day</summary><DataTable rows={s.rows} /></details>
  </>;
}
export default function MyStoredPage() {
  const [batches, setBatches] = useState(null);
  const [crops, setCrops] = useState([]);
  const [f, setF] = useState({ crop: '', qty: '', days: '0' });
  const [what, setWhat] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/farmer/stored').then((r) => r.json()).then((d) => Array.isArray(d) && setBatches(d));
    fetch('/api/crops').then((r) => r.json()).then((d) => Array.isArray(d) && setCrops(d));
  }, []);
  async function go() {
    setError(''); setWhat(null);
    const r = await fetch(`/api/farmer/spoilage?crop=${f.crop}&qty=${f.qty}&days=${f.days}`);
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setWhat(d);
  }
  return <div>
    <h1>My stored produce</h1>
    <p className='hint'>Quality stays full for the first half of the crop's shelf life, then falls to zero at the end.
      Future prices follow the recent price trend. Shelf lives are assumptions set by the warehouse.</p>
    {batches === null && <p>Loading...</p>}
    {batches?.length === 0 && <p>No produce is stored in your name yet.</p>}
    {batches?.map((b) => <div className='card' key={`${b.warehouse_id}-${b.batch_no}`}>
      <h3>{b.crop}: {b.quantity} quintals at {b.warehouse}</h3>
      <p>Stored on {b.date_in} ({b.days_stored} days ago). Spoils by {b.shelf_life_days ? addDays(b.date_in, b.shelf_life_days) : 'unknown'}.</p>
      {b.error ? <p className='err'>{b.error}</p> : <Summary s={b.summary} />}
    </div>)}
    <h2>What if I store it?</h2>
    <div className='card'><div className='grid'>
      <label>Crop<select value={f.crop} onChange={(e) => setF({ ...f, crop: e.target.value })}>
        <option value=''>-- choose --</option>{crops.map((c) => <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>)}
      </select></label>
      <label>Quantity (quintals)<input type='number' step='any' value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></label>
      <label>Days already stored<input type='number' value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></label>
    </div><button disabled={!f.crop || !f.qty} onClick={go}>Estimate the loss</button></div>
    {error && <p className='err'>{error}</p>}<Summary s={what} />
  </div>;
}
