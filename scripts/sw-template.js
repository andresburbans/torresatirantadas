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
    // Only a complete release may replace the active offline version.
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    const previous=names.filter(n=>n.startsWith('tirantes-')&&n!==CACHE_NAME);
    let isUpdate=false;
    for(const name of previous)if(await (await caches.open(name)).match('/__offline_ready__'))isUpdate=true;
    // Retain the previous release's hashed assets while open windows navigate.
    await Promise.all(previous.slice(0,-1).map(n=>caches.delete(n)));
    await self.clients.claim();
    if(isUpdate){
      const windows=await self.clients.matchAll({type:'window'});
      for(const client of windows)client.postMessage({type:'PWA_UPDATE_ACTIVATED'});
    }
  })());
});
self.addEventListener('message',event=>{
  if(event.data==='STATUS'||event.data?.type==='STATUS')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(await cache.match('/__offline_ready__'))event.ports[0]?.postMessage('OFFLINE_READY');
    // Older clients already send STATUS on controllerchange. Migrate them too.
    // A message event can await navigation after activation has completed.
    if(event.data==='STATUS'&&event.source?.type==='window')await event.source.navigate(event.source.url).catch(()=>{});
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
    if(cached)return cached;
    if(url.pathname.startsWith('/_next/static/')){
      const names=await caches.keys();
      for(const name of names.filter(n=>n.startsWith('tirantes-')&&n!==CACHE_NAME)){
        const previous=await (await caches.open(name)).match(event.request);
        if(previous)return previous;
      }
    }
    return fetch(event.request);
  })());
});
