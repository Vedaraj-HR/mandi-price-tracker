'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMe } from '@/lib/useMe';
import { MENU, ROLE_LABEL } from '@/lib/menu';
import DataTable from '@/components/DataTable';

export default function Home() {
  const me = useMe();
  const [data, setData] = useState(null);
  const [crashes, setCrashes] = useState([]);
  useEffect(() => {
    if (!me) return;
    fetch('/api/home').then((r) => (r.ok ? r.json() : null)).then(setData);
    if (me.role === 'Farmer') {
      fetch('/api/analytics/crash?days=7&drop=15').then((r) => (r.ok ? r.json() : [])).then((d) => Array.isArray(d) && setCrashes(d));
    }
  }, [me]);
  if (!me) return <p>Loading...</p>;
  const i = data?.info;
  return (
    <div>
      <h1>Welcome, {me.username} ({ROLE_LABEL[me.role]})</h1>
      {data?.kind === 'mandi' && i && <div className='stats'>
        <div className='stat'><b>{i.name}</b>{i.location}</div>
        <div className='stat'><b>{i.sales_count}</b>Sales recorded</div>
        <div className='stat'><b>Rs {Number(i.total_sales).toLocaleString('en-IN')}</b>Total sales value</div>
        <div className='stat'><b>{i.price_records}</b>Price records</div>
      </div>}
      {data?.kind === 'warehouse' && i && <div className='stats'>
        <div className='stat'><b>{i.location}</b>Warehouse</div>
        <div className='stat'><b>{i.batch_total} / {i.capacity}</b>Quintals stored</div>
        <div className='stat'><b>{i.utilization_pct}%</b>Utilisation</div>
        <div className='stat'><b>{i.batches}</b>Batches</div>
      </div>}
      {me.role === 'Farmer' && <><h2>Price crash warnings (last 7 days)</h2><DataTable rows={crashes} /></>}
      <h2>Your pages</h2>
      <div className='stats'>
        {(MENU[me.role] ?? []).filter(([href]) => href !== '/').map(([href, label]) => (
          <Link key={href} href={href} className='stat'><b>{label}</b>Open</Link>
        ))}
      </div>
    </div>
  );
}
