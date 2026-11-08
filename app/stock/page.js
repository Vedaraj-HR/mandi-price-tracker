'use client';
// app/stock/page.js
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';

export default function StockPage() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/stock').then((r) => r.json()).then(setData); }, []);
  if (!data || !data.summary) return <p>Loading...</p>;
  return (
    <div>
      <h1>Warehouse stock</h1>
      <table>
        <thead><tr><th>Warehouse</th><th>Capacity</th><th>Stored</th><th>Utilisation</th></tr></thead>
        <tbody>
          {data.summary.map((w) => (
            <tr key={w.warehouse_id}>
              <td>{w.location}</td><td>{w.capacity}</td><td>{w.batch_total}</td>
              <td><span className='bar'><span style={{ width: `${Math.min(w.utilization_pct, 100)}%` }} /></span> {w.utilization_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Quantity of each crop in each warehouse</h2>
      <DataTable rows={data.byCrop} />
    </div>
  );
}
