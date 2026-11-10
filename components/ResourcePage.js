'use client';
// components/ResourcePage.js : one reusable screen: search box, add/edit form, table with Edit/Delete buttons.
// The form is shown only to roles in writeRoles; Delete only to roles in deleteRoles
// (the API and MySQL enforce it again).
import { useCallback, useEffect, useState } from 'react';
import { useMe } from '@/lib/useMe';


export default function ResourcePage(props) {
  const { title, endpoint, idKey, columns, fields, hint, writeRoles = ['Admin'], deleteRoles = ['Admin'], allowEdit = true, upsert = false } = props;
  const me = useMe();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [opts, setOpts] = useState({});
  const [msg, setMsg] = useState(null);


  const load = useCallback(async () => {
    const r = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    if (r.ok) setRows(d); else setMsg({ ok: false, text: d.error });
  }, [endpoint, q]);

  // Synchronize the table with the server whenever the query changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fields.filter((f) => f.optionsUrl).forEach(async (f) => {
      const r = await fetch(f.optionsUrl);
      if (r.ok) { const d = await r.json(); setOpts((o) => ({ ...o, [f.name]: d })); }
    });
  }, [fields]);


  const canWrite = me && writeRoles.includes(me.role);
  const canDelete = me && deleteRoles.includes(me.role);


  async function save(e) {
    e.preventDefault();
    setMsg(null);
    const editing = editId !== null && !upsert;
    const r = await fetch(editing ? `${endpoint}/${editId}` : endpoint, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg({ ok: false, text: d.error || 'Failed' });
    setMsg({ ok: true, text: 'Saved' });
    setForm({}); setEditId(null); load();
  }


  async function remove(id) {
    if (!confirm('Delete this record?')) return;
    const r = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: true, text: 'Deleted' } : { ok: false, text: d.error || 'Failed' });
    load();
  }


  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const locked = (f) => editId !== null && f.lockOnEdit;


  return (
    <div>
      <h1>{title}</h1>
      {hint && <p className='hint'>{hint}</p>}
      {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      <input className='search' placeholder='Search...' value={q} onChange={(e) => setQ(e.target.value)} />


      {canWrite && (
        <form className='card' onSubmit={save}>
          <h3>{editId !== null ? 'Edit record' : 'Add new'}</h3>
          <div className='grid'>
            {fields.map((f) => (
              <label key={f.name}>
                {f.label}
                {f.type === 'select' ? (
                  <select value={form[f.name] ?? ''} disabled={locked(f)} onChange={(e) => set(f.name, e.target.value)}>
                    <option value=''>-- choose --</option>
                    {(opts[f.name] ?? []).map((o) => <option key={o[f.optValue]} value={o[f.optValue]}>{o[f.optLabel]}</option>)}
                  </select>
                ) : f.type === 'checkbox' ? (
                  <input type='checkbox' checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} />
                ) : (
                  <input type={f.type ?? 'text'} step={f.type === 'number' ? 'any' : undefined} value={form[f.name] ?? ''}
                    disabled={locked(f)} onChange={(e) => set(f.name, e.target.value)} />
                )}
              </label>
            ))}
          </div>
          <button type='submit'>{editId !== null ? 'Update' : 'Add'}</button>
          {editId !== null && <button type='button' className='secondary' onClick={() => { setEditId(null); setForm({}); }}>Cancel</button>}
        </form>
      )}


      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}{(canWrite || canDelete) && <th>Actions</th>}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[idKey]}>
              {columns.map((c) => <td key={c.key}>{String(row[c.key] ?? '')}</td>)}
              {(canWrite || canDelete) && (
                <td>
                  {canWrite && allowEdit && <button className='small' onClick={() => { setEditId(row[idKey]); setForm({ ...row }); }}>Edit</button>}
                  {canDelete && <button className='small danger' onClick={() => remove(row[idKey])}>Delete</button>}
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length + 1}>No records</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
