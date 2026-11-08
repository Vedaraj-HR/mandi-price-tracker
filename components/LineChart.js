
export default function LineChart({ data, series }) {
    if (!data || data.length === 0) return <p className='hint'>No data for this choice.</p>;
    const W = 680, H = 250, P = 40;
    const vals = data.flatMap((d) => series.map((s) => d[s.key])).filter((v) => v !== null && v !== undefined);
    const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    const x = (i) => P + (i * (W - 2 * P)) / Math.max(data.length - 1, 1);
    const y = (v) => H - P - ((v - min) / span) * (H - 2 * P);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className='chart'>
            {series.map((s) => (
                <polyline key={s.key} fill='none' stroke={s.color} strokeWidth='2'
                    points={data.map((d, i) => (d[s.key] == null ? null : `${x(i)},${y(d[s.key])}`)).filter(Boolean).join(' ')} />
            ))}
            <text x='4' y={P} fontSize='11'>{max}</text>
            <text x='4' y={H - P} fontSize='11'>{min}</text>
            <text x={P} y={H - 10} fontSize='11'>{data[0].price_date}</text>
            <text x={W - P - 60} y={H - 10} fontSize='11'>{data[data.length - 1].price_date}</text>
            {series.map((s, i) => <text key={s.key} x={P + 120 * i} y='16'
                fontSize='12' fill={s.color}>{s.label}</text>)}
        </svg>
    );
}
