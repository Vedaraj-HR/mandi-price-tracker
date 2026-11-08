'use client';
// app/page.js : replace the default Next.js page
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';


export default function Dashboard() {
  const [d, setD] = useState(null);
  const [stock, setStock] = useState([]);
  const [crashes, setCrashes] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setD);
    fetch('/api/stock').then((r) => r.json()).then((x) => setStock(x.summary ?? []));
    fetch('/api/analytics/crash?days=7&drop=15').then((r) => r.json()).then((x) => Array.isArray(x) && setCrashes(x));
  }, []);


  if (!d || !d.counts) return <p>Loading...</p>;
  const c = d.counts;
  return (
    <div>
      <h1>Dashboard</h1>
      <div className='stats'>
        <div className='stat'><b>{c.farmers}</b>Farmers</div>
        <div className='stat'><b>{c.mandis}</b>Mandis</div>
        <div className='stat'><b>{c.sales}</b>Sales recorded</div>
        <div className='stat'><b>Rs {Number(c.revenue).toLocaleString('en-IN')}</b>Total sales value</div>
      </div>
      <h2>Price crash alerts (last 7 days, drop of 15 percent or more)</h2>
      <DataTable rows={crashes} />
      <h2>Top mandis by sales value</h2>
      <DataTable rows={d.topMandis} />
      <h2>Warehouse utilisation</h2>
      <table>
        <tbody>
          {stock.map((w) => (
            <tr key={w.warehouse_id}>
              <td>{w.location}</td>
              <td><span className='bar'><span style={{ width: `${Math.min(w.utilization_pct, 100)}%` }} /></span> {w.utilization_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
