import { useEffect, useRef, useState } from 'react';

export default function AppUpdate() {
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    let disposed = false;
    const workers = new Set<ServiceWorker>();
    const refresh = () => {
      if (!disposed) setReady(Boolean(registration.current?.waiting && navigator.serviceWorker.controller));
    };
    const watch = () => {
      const installing = registration.current?.installing;
      if (installing && !workers.has(installing)) {
        workers.add(installing);
        installing.addEventListener('statechange', refresh);
      }
      refresh();
    };
    const check = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void registration.current?.update().then(watch).catch(() => undefined);
      }
    };
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(value => {
      if (disposed) return;
      registration.current = value;
      value.addEventListener('updatefound', watch);
      watch();
    }).catch(() => undefined);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    return () => {
      disposed = true;
      registration.current?.removeEventListener('updatefound', watch);
      for (const worker of workers) worker.removeEventListener('statechange', refresh);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
    };
  }, []);

  if (!ready) return null;
  return <section className="panel row" aria-label="App update">
    <p role="status">A new version of Lexicon is ready.</p>
    <button className="primary" disabled={applying} onClick={() => {
      const worker = registration.current?.waiting;
      if (!worker) { window.location.reload(); return; }
      setApplying(true);
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {once:true});
      worker.postMessage({type:'SKIP_WAITING'});
    }}>{applying ? 'Updating…' : 'Update and reload'}</button>
  </section>;
}
