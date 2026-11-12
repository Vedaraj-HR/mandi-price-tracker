'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';

export default function BestMandiPage() {
    const [crops, setCrops] = useState([]);
    const [f, setF] = useState({ crop: '', qty: '', rate: '', ret: false });
    const [res, setRes] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/crops').then((r) => r.json()).then((d) =>
            Array.isArray(d) && setCrops(d));
    }, []);

    async function go() {
        setError('');
        setRes(null);
        const p = new URLSearchParams({
            crop: f.crop,
            qty: f.qty,
            rate: f.rate,
            return: f.ret ? '1' : '0'
        });
        const r = await fetch(`/api/farmer/best-mandi?${p}`);
        const d = await r.json();
        if (!r.ok) return setError(d.error);
        setRes(d);
    }

    const top = res?.rows?.[0];

    return (
        <div>
            <h1>Where should I sell?</h1>
            <p className='hint'>
                Distances are real road distances from your saved location, through open roads.
                The rate is optional: enter what your own transport quoted per km for the whole load.
                Without it the mandis are ranked by price only.
            </p>
            <div className='card'>
                <div className='grid'>
                    <label>
                        Crop
                        <select value={f.crop} onChange={(e) => setF({ ...f, crop: e.target.value })}>
                            <option value=''>-- choose --</option>
                            {crops.map((c) =>
                                <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>
                            )}
                        </select>
                    </label>
                    <label>
                        Quantity (quintals)
                        <input type='number' step='any' value={f.qty}
                            onChange={(e) => setF({ ...f, qty: e.target.value })} />
                    </label>
                    <label>
                        Transport rate per km, whole load (optional)
                        <input type='number' step='any' value={f.rate}
                            onChange={(e) => setF({ ...f, rate: e.target.value })} />
                    </label>
                    <label>
                        Return trip also charged
                        <input type='checkbox' checked={f.ret}
                            onChange={(e) => setF({ ...f, ret: e.target.checked })} />
                    </label>
                </div>
                <button disabled={!f.crop || !f.qty} onClick={go}>
                    Find the best mandi
                </button>
            </div>
            {error && <p className='err'>{error}</p>}
            {res && top && (
                <p className='ok'>
                    Ranked by {res.ranked_by}. Best choice: {top.mandi} at Rs
                    {top.price_per_quintal} per quintal, {top.distance_km} km away
                    {top.net_profit !== null ? `, net profit Rs ${top.net_profit}` : ''}.
                    Your nearest mandi is {res.nearest}.
                </p>
            )}
            {res && <DataTable rows={res.rows} highlightFirst />}
            {res && (
                <p className='hint'>
                    Break-even rate: the highest rate per km at which this mandi still gives you
                    more than your nearest mandi. Negotiate with your transporter against that number.
                </p>
            )}
        </div>
    );
}