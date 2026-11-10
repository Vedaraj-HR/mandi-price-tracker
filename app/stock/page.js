'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
export default function StockPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/stock').then((r) => r.json()).then(setData); }, []);
  if (!data || !data.byCrop) return <p>Loading...</p>;
  const w = data.summary;
  return <div><h1>Stock in my warehouse</h1>
    {w && <p>{w.location}: {w.batch_total} of {w.capacity} quintals
      <span className='bar'><span style={{ width: `${Math.min(w.utilization_pct, 100)}%` }} /></span> {w.utilization_pct}%</p>}
    <h2>Quantity of each crop</h2><DataTable rows={data.byCrop} /></div>;
}
