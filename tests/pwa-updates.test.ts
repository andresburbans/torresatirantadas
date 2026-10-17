import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monitorPwa } from '../src/lib/pwa';

test('PWA checks on reconnect and resume, preserves offline use, and cleans up listeners',async()=>{
  const descriptors=new Map(['navigator','document','window'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const serviceWorker=new EventTarget();
  const doc=Object.assign(new EventTarget(),{visibilityState:'visible'});
  const win=new EventTarget();
  let timer:(()=>void)|undefined,cleared=false,checks=0,ready=0,updates=0,networkFails=false,reloads=0;
  const reg=Object.assign(new EventTarget(),{
    active:{postMessage:(_:string,ports:MessagePort[])=>ports[0].postMessage('OFFLINE_READY')},
    waiting:null,installing:null as (EventTarget&{state:string})|null,
    update:async()=>{checks++;if(networkFails)throw Error('network unavailable');},
  });
  const nav={onLine:true,serviceWorker:Object.assign(serviceWorker,{controller:{},ready:Promise.resolve(reg)})};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:nav});
  Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
  Object.defineProperty(globalThis,'window',{configurable:true,value:Object.assign(win,{location:{reload:()=>reloads++},setInterval:(fn:()=>void)=>{timer=fn;return 1;},clearInterval:()=>{cleared=true;}})});
  let stop:(()=>void)|undefined;
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  try {
    stop=monitorPwa(reg as unknown as ServiceWorkerRegistration,()=>ready++,()=>updates++);
    await settle();
    assert.equal(checks,1);
    nav.onLine=false;win.dispatchEvent(new Event('online'));timer!();await settle();assert.equal(checks,1);
    nav.onLine=true;win.dispatchEvent(new Event('online'));await settle();assert.equal(checks,2);
    doc.visibilityState='hidden';doc.dispatchEvent(new Event('visibilitychange'));await settle();assert.equal(checks,2);
    doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));await settle();assert.equal(checks,3);
    timer!();await settle();assert.equal(checks,4);
    networkFails=true;win.dispatchEvent(new Event('online'));await settle();assert.equal(checks,5);
    assert.ok(ready>0); // A failed update leaves the installed offline release usable.
    const worker=Object.assign(new EventTarget(),{state:'installing'});
    reg.installing=worker;reg.dispatchEvent(new Event('updatefound'));
    assert.equal(updates,0);worker.state='installed';worker.dispatchEvent(new Event('statechange'));assert.equal(updates,1);
    serviceWorker.dispatchEvent(new Event('controllerchange'));serviceWorker.dispatchEvent(new Event('controllerchange'));assert.equal(reloads,1);
    stop();assert.ok(cleared);win.dispatchEvent(new Event('online'));timer!();await settle();assert.equal(checks,5);
  } finally {
    stop?.();
    descriptors.forEach((descriptor,key)=>{if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);});
  }
});
