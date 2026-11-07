
'use client';
import { useEffect, useState } from 'react';

function Card({ title, r }) {
    return (
        <div className='card'>
            <h3>{title}</h3>
            {!r && <p>No route exists.</p>}
            {r?.error && <p className='err'>{r.error}</p>}
            {r && !r.error && (
                <>
                    <p><b>{r.route.join(' > ')}</b></p>
                    <p>Total cost: Rs {r.totalCost} per quintal | Distance: {r.totalDistance} km</p>
                </>
            )}
        </div>
    );
}

export default function CheapestRoute() {
    const [mandis, setMandis] = useState([]);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [res, setRes] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/mandis').then((r) => r.json()).then((d) => Array.isArray(d) && setMandis(d));
    }, []);

    async function find() {
        setError(''); setRes(null);
        const r = await fetch(`/api/routes/cheapest?from=${from}&to=${to}`);
        const d = await r.json();
        if (!r.ok) return setError(d.error);
        setRes(d);
    }

    const options = mandis.map((m) => <option key={m.mandi_id} value={m.mandi_id}>{m.name}</option>);
    return (
        <div>
            <h2>Cheapest route finder</h2>
            <div className='card'>
                <div className='grid'>
                    <label>From<select value={from} onChange={(e) => setFrom(e.target.value)}><option value=''>-- choose --</option>{options}</select></label>
                    <label>To<select value={to} onChange={(e) => setTo(e.target.value)}><option value=''>-- choose --</option>{options}</select></label>
                </div>
                <button onClick={find} disabled={!from || !to}>Find cheapest route</button>
                {error && <p className='err'>{error}</p>}
            </div>
            {res && (
                <>
                    <Card title='Neo4j (graph path search)' r={res.neo4j} />
                    <Card title='MySQL (recursive CTE)' r={res.sql} />
                    {res.agree !== null && <p className={res.agree ? 'ok' : 'err'}>
                        {res.agree ? 'Both databases agree on the cheapest cost.' : 'The two databases disagree: run npm run graph:sync.'}</p>}
                </>
            )}
        </div>
    );
}
