
'use client';
import { useEffect, useState } from 'react';
import LineChart from '@/components/LineChart';
import DataTable from '@/components/DataTable';

export default function AnalyticsPage() {
    const [mandis, setMandis] = useState([]);
    const [crops, setCrops] = useState([]);
    const [mandi, setMandi] = useState('');
    const [crop, setCrop] = useState('');
    const [days, setDays] = useState(30);
    const [drop, setDrop] = useState(15);
    const [trend, setTrend] = useState(null);
    const [crashes, setCrashes] = useState(null);
    const [compare, setCompare] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/mandis').then((r) => r.json()).then((d) => Array.isArray(d) && setMandis(d));
        fetch('/api/crops').then((r) => r.json()).then((d) => Array.isArray(d) && setCrops(d));
    }, []);

    async function get(url, setter) {
        setError('');
        const r = await fetch(url);
        const d = await r.json();
        if (!r.ok) return setError(d.error);
        setter(d);
    }

    return (
        <div>
            <h1>Price analysis</h1>
            {error && <p className='err'>{error}</p>}
            <div className='card'>
                <div className='grid'>
                    <label>Mandi<select value={mandi} onChange={(e) => setMandi(e.target.value)}><option value=''>-- choose --</option>
                        {mandis.map((m) => <option key={m.mandi_id} value={m.mandi_id}>{m.name}</option>)}</select></label>
                    <label>Crop<select value={crop} onChange={(e) => setCrop(e.target.value)}><option value=''>-- choose --</option>{crops.map((c) => <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>)}
                    </select></label>
                    <label>Days of history<input type='number' value={days} onChange={(e) => setDays(e.target.value)} /></label>
                    <label>Crash threshold (percent)<input type='number' value={drop} onChange={(e) => setDrop(e.target.value)} /></label>
                </div>
                <button disabled={!mandi || !crop} onClick={() => get(`/api/analytics/trend?mandi=${mandi}&crop=${crop}&days=${days}`, setTrend)}>Price trend</button>
                <button disabled={!crop} onClick={() => get(`/api/analytics/compare?crop=${crop}`, setCompare)}>Compare mandis</button>
                <button onClick={() => get(`/api/analytics/crash?days=${days}&drop=${drop}`, setCrashes)}>Find price crashes</button>
            </div>

            {trend && (<><h2>Trend</h2><LineChart data={trend} series={[{ key: 'modal_price', label: 'Modal price', color: '#1f5f2e' }, { key: 'moving_avg', label: '3-day average', color: '#d9822b' }]} /><DataTable rows={trend} /></>)}
            {compare && (<><h2>Latest price in each mandi</h2><DataTable rows={compare} highlightFirst /></>)}
            {crashes && (<><h2>Early warning: price crashes</h2><DataTable rows={crashes} /></>)}
        </div>
    );
}
