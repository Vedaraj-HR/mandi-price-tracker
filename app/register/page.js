
 // app/register/page.js : farmer sign-up (public)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [f, setF] = useState({ username: '', password: '', name: '', phone: '', place: '', latitude: '', longitude: '' });
    const [error, setError] = useState('');

    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    async function submit(e) {
        e.preventDefault();
        setError('');
        const r = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(f)
        });
        const d = await r.json();
        if (!r.ok) return setError(d.error);
        router.push('/login');
    }

    return (
        <form className='card login' onSubmit={submit}>
            <h1>Farmer sign-up</h1>
            <label>Name<input value={f.name} onChange={set('name')} /></label>
            <label>Phone (10 to 15 digits)<input value={f.phone} onChange={set('phone')} /></label>
            <label>Village or town<input value={f.place} onChange={set('place')} /></label>
            <label>Latitude (only if the place is not found)<input type='number' step='any' value={f.latitude} onChange={set('latitude')} /></label>
            <label>Longitude (only if the place is not found)<input type='number' step='any' value={f.longitude} onChange={set('longitude')} /></label>
            <label>Username<input value={f.username} onChange={set('username')} /></label>
            <label>Password (8 or more characters)<input type='password' value={f.password} onChange={set('password')} /></label>
            {error && <p className='err'>{error}</p>}
            <button type='submit'>Create account</button>
            <p className='hint'>Already registered? <a href='/login'>Log in</a></p>
        </form>
    );
}
