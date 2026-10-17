/* Generated during build. All assets must be cached before installation succeeds. */
const CACHE_NAME = '__CACHE_NAME__';
const ASSETS = __ASSETS__;
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Individual requests avoid CDN limits on very large addAll batches.
    await Promise.all(ASSETS.map(async url=>{
      const response=await fetch(new Request(url,{cache:'reload'}));
      if(!response.ok)throw new Error(`Precache failed: ${url}`);
      await cache.put(url,response);
    }));
    await cache.put('/__offline_ready__',new Response('1'));
    // Update activates when all old clients close, preserving each build's assets.
  })());
});
self.addEventListener('activate', event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(n=>n.startsWith('tirantes-')&&n!==CACHE_NAME).map(n=>caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{
  if(event.data==='STATUS')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(await cache.match('/__offline_ready__'))event.ports[0]?.postMessage('OFFLINE_READY');
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // Navigation always uses the current worker's complete matching build.
    if(event.request.mode==='navigate')return (await cache.match(url.pathname))||(await cache.match('/'))||fetch(event.request);
    const cached=await cache.match(event.request);
    return cached||fetch(event.request);
  })());
});
