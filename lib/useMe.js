'use client';
// lib/useMe.js : tells a page who is logged in (refetches when dep changes)
import { useEffect, useState } from 'react';


export function useMe(dep) {
  const [me, setMe] = useState(null);
  useEffect(() => {
    fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)).then(setMe).catch(() => setMe(null));
  }, [dep]);
  return me;
}
