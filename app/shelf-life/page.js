'use client';
import { useEffect, useState } from 'react';
import { useMe } from '@/lib/useMe';
export default function ShelfLifePage() {
  const me = useMe(); const [rows, setRows] = useState([]); const [edit, setEdit] = useState({}); const [msg, setMsg] = useState(null);
  const load = () => fetch('/api/crops').then((r) => r.json()).then((d) => Array.isArray(d) && setRows(d));
  useEffect(() => { load(); }, []);
  const admin = me?.role === 'WarehouseAdmin';
  async function save(id) {
    const r = await fetch(`/api/crops/${id}/shelf-life`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shelf_life_days: edit[id] }) });
    const d = await r.json(); setMsg(r.ok ? { ok: true, text: 'Saved' } : { ok: false, text: d.error }); load();
  }
  return <div><h1>Crops and shelf life</h1>
    <p className='hint'>Shelf life is in days without refrigeration. These are editable assumptions.</p>
    {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
    <table><thead><tr><th>Crop</th><th>Category</th><th>Shelf life (days)</th>{admin && <th>Change</th>}</tr></thead>
      <tbody>{rows.map((c) => <tr key={c.crop_id}><td>{c.crop_name}</td><td>{c.category}</td><td>{c.shelf_life_days ?? 'not set'}</td>
        {admin && <td><input type='number' style={{ width: 80 }} value={edit[c.crop_id] ?? ''} onChange={(e) => setEdit({ ...edit, [c.crop_id]: e.target.value })} />
          <button className='small' onClick={() => save(c.crop_id)}>Save</button></td>}</tr>)}</tbody>
    </table>
  </div>;
}
