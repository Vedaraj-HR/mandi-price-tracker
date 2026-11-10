'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/lib/useMe';
import { MENU, ROLE_LABEL } from '@/lib/menu';

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
      {(MENU[me.role] ?? []).map(([href, label]) => (
        <Link key={href} href={href} className={path === href ? 'active' : ''}>{label}</Link>
      ))}
      <span className='spacer' />
      <span className='who'>{me.username} ({ROLE_LABEL[me.role] ?? me.role})</span>
      <button className='small' onClick={logout}>Log out</button>
    </nav>
  );
}
