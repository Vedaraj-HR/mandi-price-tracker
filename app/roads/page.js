'use client';
import { useCallback, useEffect, useState } from 'react';

export default function RoadsPage() {
    const [rows, setRows] = useState([]);
    const [msg, setMsg] = useState(null);

    const load = useCallback(async () => {
        const r = await fetch('/api/roads');
        const d = await r.json();
        if (r.ok) setRows(d); else setMsg({ ok: false, text: d.error });
    }, []);
    useEffect(() => { load(); }, [load]);

    async function act(id, action) {
        if (action === 'delete' && !confirm('Delete this road permanently?')) return;
        const r = await fetch(`/api/roads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
        const d = await r.json().catch(() => ({}));
        setMsg(r.ok ? { ok: true, text: d.message ?? 'Done' } : { ok: false, text: d.error ?? 'Failed' });
        load();
    }

    return (
        <div>
            <h1>Roads leaving my mandi</h1>
            <p className='hint'>A closed road is skipped by every farmer search. Changes are saved in MySQL and Neo4j together.</p>
            {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
            <table>
                <thead><tr><th>To</th><th>Distance (km)</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id}>
                            <td>{r.destination}</td><td>{r.distance}</td><td>{r.is_open ? 'Open' : 'Closed'}</td>
                            <td>
                                {r.is_open
                                    ? <button className='small danger' onClick={() => act(r.id, 'close')}>Close</button>
                                    : <button className='small' onClick={() => act(r.id, 'open')}>Reopen</button>}
                                <button className='small' onClick={() => act(r.id, 'refresh')}>Refresh distance</button>
                                <button className='small danger' onClick={() => act(r.id, 'delete')}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && <tr><td colSpan='4'>No roads</td></tr>}
                </tbody>
            </table>
        </div>
    );
}