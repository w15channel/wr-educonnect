import { useEffect } from 'react';

// Current version is read from the meta tag at boot time
const CURRENT_VERSION = document.querySelector('meta[name="app-version"]')?.content || '0';

export function useVersionCheck(intervalMs = 60000) {
  useEffect(() => {
    const check = async () => {
      try {
        // Fetch index.html bypassing cache
        const res = await fetch('/', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
        const html = await res.text();
        const match = html.match(/<meta name="app-version" content="([^"]+)"/);
        if (match && match[1] && match[1] !== CURRENT_VERSION) {
          // New version detected — clear caches and hard reload
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          window.location.reload(true);
        }
      } catch {
        // silently ignore network errors
      }
    };

    // Check immediately after mount, then on interval
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, []);
}