'use client';
import { useState } from 'react';
import DataTable from '@/components/DataTable';

const iso = (d) => d.toISOString().slice(0, 10);
const now = new Date();
const quarterStart = new Date(Date.UTC(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1
));

export default function MyIncomePage() {
    const [from, setFrom] = useState(iso(quarterStart));
    const [to, setTo] = useState(iso(now));
    const [rows, setRows] = useState(null);
    const [error, setError] = useState('');

    async function go() {
        setError('');
        const r = await fetch(`/api/farmer/income?from=${from}&to=${to}`);
        const d = await r.json();
        if (!r.ok) return setError(d.error);
        setRows(d);
    }

    return (
        <div>
            <h1>My income</h1>
            <p className='hint'>
                Total and per-crop earnings for the season you choose.
                The default is the current quarter.
            </p>
            <div className='card'>
                <div className='grid'>
                    <label>
                        From
                        <input type='date' value={from}
                            onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label>
                        To
                        <input type='date' value={to}
                            onChange={(e) => setTo(e.target.value)} />
                    </label>
                </div>
                <button onClick={go}>Show my income</button>
            </div>
            {error && <p className='err'>{error}</p>}
            {rows && <DataTable rows={rows} />}
        </div>
    );
}