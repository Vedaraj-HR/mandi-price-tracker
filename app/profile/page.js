'use client';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const [f, setF] = useState(null);
    const [near, setNear] = useState([]);
    const [msg, setMsg] = useState(null);

    async function load() {
        const r = await fetch('/api/farmer/profile');
        const d = await r.json();
        if (r.ok && d.profile) {
            setF({
                name: d.profile.name,
                phone: d.profile.phone,
                place: d.profile.place ?? '',
                latitude: '',
                longitude: ''
            });
            setNear(d.near);
        }
    }

    useEffect(() => { load(); }, []);

    if (!f) return <p>Loading...</p>;

    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    async function save(e) {
        e.preventDefault();
        const r = await fetch('/api/farmer/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(f)
        });
        const d = await r.json();
        setMsg(r.ok
            ? { ok: true, text: `Saved. ${d.graph}` }
            : { ok: false, text: d.error });
        load();
    }

    return (
        <form className='card' onSubmit={save}>
            <h1>My profile</h1>
            {msg && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
            <div className='grid'>
                <label>
                    Name
                    <input value={f.name} onChange={set('name')} />
                </label>
                <label>
                    Phone
                    <input value={f.phone} onChange={set('phone')} />
                </label>
                <label>
                    Village or town
                    <input value={f.place} onChange={set('place')} />
                </label>
                <label>
                    Latitude (only if the place is not found)
                    <input type='number' step='any' value={f.latitude}
                        onChange={set('latitude')} />
                </label>
                <label>
                    Longitude (only if the place is not found)
                    <input type='number' step='any' value={f.longitude}
                        onChange={set('longitude')} />
                </label>
            </div>
            <button type='submit'>Save</button>
            <h3>My nearest mandis</h3>
            <ul>
                {near.map((n) =>
                    <li key={n.mandi}>{n.mandi}: {n.distance} km</li>
                )}
            </ul>
        </form>
    );
}