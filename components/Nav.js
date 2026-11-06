'use client';
// components/Nav.js : every page link; the Users link only for Admin
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/lib/useMe';


const LINKS = [
  ['/', 'Dashboard'], ['/sales', 'Sales'], ['/prices', 'Prices'], ['/analytics', 'Analytics'], ['/recommend', 'Best mandi'],
  ['/routes', 'Routes'], ['/farmers', 'Farmers'], ['/batches', 'Storage'], ['/stock', 'Stock'],
  ['/crops', 'Crops'], ['/mandis', 'Mandis'], ['/warehouses', 'Warehouses'],
];


export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const me = useMe(path);
  if (!me) return <nav><span className='brand'>Mandi Price Tracker</span></nav>;

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }


  return (
    <nav>
      <span className='brand'>Mandi Price Tracker</span>
      {LINKS.map(([href, label]) => <Link key={href} href={href} className={path === href ? 'active' : ''}>{label}</Link>)}
      {me.role === 'Admin' && <Link href='/users' className={path === '/users' ? 'active' : ''}>Users</Link>}
      <span className='spacer' />
      <span className='who'>{me.username} ({me.role})</span>
      <button className='small' onClick={logout}>Log out</button>
    </nav>
  );
}
