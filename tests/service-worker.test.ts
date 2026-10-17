import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
function harness(fail=false,version='test',store=new Map<string,Map<string,Response>>()) {
 const handlers:Record<string,(e:any)=>void>={};
 const saved=new Map<string,Response>();store.set('tirantes-'+version,saved);let online=true,claimed=false;
 const code=readFileSync('scripts/sw-template.js','utf8').replace('__CACHE_NAME__','tirantes-'+version).replace('__ASSETS__',JSON.stringify(['/','/app.js','/styles.css']));
 vm.runInNewContext(code,{
  Request:class extends Request {constructor(url:string,opts?:RequestInit){super(new URL(url,'https://test.local'),opts);}},Response,URL,
  caches:{open:async(name:string)=>{const entries=store.get(name)!;return {put:async(k:string,v:Response)=>{entries.set(k,v.clone());},match:async(k:string|Request)=>entries.get(typeof k==='string'?k:new URL(k.url).pathname)?.clone()};},keys:async()=>['unrelated',...store.keys()],delete:async(name:string)=>store.delete(name)},
  fetch:async(req:Request)=>{if(!online||fail&&new URL(req.url).pathname==='/app.js')throw Error('offline');return new Response((version==='test'?'':version+':')+new URL(req.url).pathname);},
  self:{addEventListener:(name:string,fn:any)=>handlers[name]=fn,location:{origin:'https://test.local'},clients:{claim:async()=>{claimed=true;}}},
 });
 async function lifecycle(name:string){let pending:Promise<void>|undefined;handlers[name]({waitUntil:(p:Promise<void>)=>pending=p});await pending;}
 return {saved,handlers,lifecycle,offline:()=>{online=false;},claimed:()=>claimed};
}
test('PWA caches complete build and serves reload and JS with network unavailable',async()=>{
 const h=harness();await h.lifecycle('install');await h.lifecycle('activate');h.offline();
 assert.ok(h.claimed());assert.ok(h.saved.has('/__offline_ready__'));
 for(const [url,mode] of [['/','navigate'],['/app.js','cors']] as const){
  let response:Promise<Response>|undefined;
  h.handlers.fetch({request:{url:'https://test.local'+url,mode,method:'GET'},respondWith:(r:Promise<Response>)=>response=r});
  assert.equal(await (await response!).text(),url);
 }
 let status='';let ready:Promise<void>|undefined;
 h.handlers.message({data:'STATUS',ports:[{postMessage:(s:string)=>status=s}],waitUntil:(p:Promise<void>)=>ready=p});await ready;
 assert.equal(status,'OFFLINE_READY');
});
test('partial cache failure never announces offline readiness',async()=>{
 const h=harness(true);await assert.rejects(h.lifecycle('install'));assert.equal(h.saved.has('/__offline_ready__'),false);
});

test('next release downloads separately and becomes usable offline after activation',async()=>{
 const store=new Map<string,Map<string,Response>>();
 const old=harness(false,'v1',store);await old.lifecycle('install');await old.lifecycle('activate');
 const next=harness(false,'v2',store);await next.lifecycle('install');
 assert.ok(store.has('tirantes-v1'));assert.ok(store.has('tirantes-v2'));
 const read=async(worker:ReturnType<typeof harness>)=>{
  let response:Promise<Response>|undefined;
  worker.handlers.fetch({request:{url:'https://test.local/',mode:'navigate',method:'GET'},respondWith:(r:Promise<Response>)=>response=r});
  return (await response!).text();
 };
 old.offline();assert.equal(await read(old),'v1:/');
 await next.lifecycle('activate');next.offline();assert.equal(await read(next),'v2:/');
 assert.equal(store.has('tirantes-v1'),false);
});
