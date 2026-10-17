/** Keep a complete cached release usable while the next release downloads. */
export function monitorPwa(
  registration: ServiceWorkerRegistration,
  onReady: () => void,
  onUpdate: () => void,
) {
  let disposed = false, checking = false;
  const workers = new Map<ServiceWorker, () => void>();
  const channels = new Set<MessageChannel>();
  function markReady() {
    if (disposed || !registration.active) return;
    const channel = new MessageChannel();
    channels.add(channel);
    channel.port1.onmessage = event => {
      if (!disposed && event.data === 'OFFLINE_READY') onReady();
      channel.port1.close(); channel.port2.close(); channels.delete(channel);
    };
    registration.active.postMessage('STATUS', [channel.port2]);
  }
  function trackInstalling() {
    const worker = registration.installing;
    if (!worker || workers.has(worker)) return;
    const changed = () => {
      if (disposed) return;
      if (worker.state === 'installed') {
        markReady();
        if (navigator.serviceWorker.controller) onUpdate();
      }
      if (worker.state === 'activated') markReady();
    };
    worker.addEventListener('statechange', changed);
    workers.set(worker, changed);
    changed();
  }
  async function check() {
    if (disposed || checking || !navigator.onLine || document.visibilityState !== 'visible') return;
    checking = true;
    try { await registration.update(); } catch { /* Keep the installed release when the network fails. */ }
    finally { checking = false; }
  }
  const resume = () => { void check(); };
  registration.addEventListener('updatefound', trackInstalling);
  navigator.serviceWorker.addEventListener('controllerchange', markReady);
  window.addEventListener('online', resume);
  document.addEventListener('visibilitychange', resume);
  const interval = window.setInterval(resume, 15 * 60 * 1000);
  trackInstalling();
  if (registration.waiting) onUpdate();
  void navigator.serviceWorker.ready.then(markReady);
  void check();
  return () => {
    disposed = true;
    registration.removeEventListener('updatefound', trackInstalling);
    navigator.serviceWorker.removeEventListener('controllerchange', markReady);
    window.removeEventListener('online', resume);
    document.removeEventListener('visibilitychange', resume);
    window.clearInterval(interval);
    workers.forEach((listener, worker) => worker.removeEventListener('statechange', listener));
    channels.forEach(channel => { channel.port1.close(); channel.port2.close(); });
  };
}
