'use client';
// app/login/page.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');


  async function submit(e) {
    e.preventDefault();
    setError('');
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    router.push('/');
    router.refresh();
  }

  return (
    <form className='card login' onSubmit={submit}>
      <h1>Mandi Price Tracker</h1>
      <label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoFocus /></label>
      <label>Password<input type='password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      {error && <p className='err'>{error}</p>}
      <button type='submit'>Log in</button>
      <p className='hint'>New farmer? <a href='/register'>Create an account</a></p>
    </form>
  );
}
