import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, calculate, dms, number, toDms, isInputs, readInputs } from '../src/lib/geometry';
import { CATALOG, ALPHAS } from '../src/lib/catalog';
test('GI6KL table correction at alpha 5 agrees within table rounding',()=>{
 const r=calculate({...DEFAULTS,beta:toDms(57.117)});
 assert.equal(r.valid,true);assert.ok(Math.abs(r.x1-2.460)<.001);assert.equal(r.c,26.219);
});
test('all tower/soil changes at all tabulated slopes agree to 1.1 mm',()=>{
 for(const tower of ['GI6KL','G6KL','GR6KL'] as const)for(const [i,alpha] of ALPHAS.entries()){
  const c=CATALOG[tower];const r=calculate({...DEFAULTS,tower,alpha:String(alpha),x0:String(c['3'].x[i]),h0:String(c['3'].h),target:String(c['4'].h),beta:toDms(c.beta)});
  assert.ok(r.valid);assert.ok(Math.abs(r.x1-c['4'].x[i])<.0011,`${tower}, alpha ${alpha}: ${r.x1}`);
 }
});
test('fixed datum deeper and shallower excavation, and inverse are reversible',()=>{
 const base={...DEFAULTS,datum:'fixed' as const,h0:'4',x0:'2.46',target:'3.5'};
 const r=calculate(base);assert.ok(r.x1<2.46);assert.ok(Math.abs(r.x1-(2.46-.5/Math.tan(dms(base.beta)*Math.PI/180)))<1e-12);
 const inverse=calculate({...base,mode:'x',target:String(r.x1)});assert.ok(Math.abs(inverse.h1-3.5)<1e-12);
 const noChange=calculate({...base,target:'4'});assert.equal(noChange.x1,2.46);
});
test('terrain inverse and seal elevations use moving local terrain',()=>{
 const r=calculate({...DEFAULTS,groundElevation:'100'});
 const inv=calculate({...DEFAULTS,mode:'x',target:String(r.x1)});assert.ok(Math.abs(inv.h1-4)<1e-12);
 assert.equal(r.seal0,96.5);assert.ok(Math.abs(r.seal1!-(100-r.deltaX*Math.tan(5*Math.PI/180)-4))<1e-12);
});
test('invalid and singular geometry never yields valid output',()=>{
 for(const v of [{c:''},{target:'3.5.2'},{h0:'0'},{target:'-2'},{beta:{deg:'90',min:'0',sec:'0'}},{beta:{deg:'57',min:'60',sec:'0'}},{phi:{deg:'',min:'0',sec:'0'}},{alpha:'57.1169'},{target:'0.01'}]) assert.equal(calculate({...DEFAULTS,...v}).valid,false,JSON.stringify(v));
});
test('commas, precision, and imported sessions',()=>{
 assert.equal(number(' 2,460 '),2.46);assert.ok(Number.isNaN(number('')));assert.ok(Number.isNaN(number('2e3')));
 assert.ok(Math.abs(dms(toDms(57.117))-57.117)<1e-10);
 assert.equal(isInputs(DEFAULTS),true);assert.equal(isInputs({...DEFAULTS,beta:null}),false);assert.equal(isInputs({}),false);
});
test('pivot affects local coordinates without altering radial C+X',()=>{
 const a=calculate(DEFAULTS),b=calculate({...DEFAULTS,pivot:'3.4'});
 assert.equal(a.distance,b.distance);assert.equal(a.distance,a.c+a.x1);
 const phi=dms(DEFAULTS.phi)*Math.PI/180;
 assert.ok(Math.abs(Math.hypot(a.plan[2].x,a.plan[2].y-a.pivot)-a.distance)<1e-12);
 assert.ok(Math.abs(a.plan[2].x-a.distance*Math.cos(phi))<1e-12);
 assert.ok(Math.abs(b.plan[2].y-a.plan[2].y-.1)<1e-12);
 assert.equal(a.plan[0].x,-a.plan[3].x);assert.equal(a.plan[0].y,-a.plan[1].y);
});
test('previous cases discard the retired center offset and keep the edge geometry',()=>{
 const previous={...DEFAULTS,centerOffset:'0.5'};
 const restored=readInputs(previous);
 assert.deepEqual(restored,DEFAULTS);
 assert.equal('centerOffset' in restored!,false);
 assert.equal('distanceCenter' in calculate(restored!),false);
 assert.equal(readInputs({}),null);
});
test('target seal elevation yields the same physical translation in both datums',()=>{
 const terrain=calculate({...DEFAULTS,mode:'seal',target:'96',groundElevation:'100'});
 const fixed=calculate({...DEFAULTS,datum:'fixed',mode:'seal',target:'96',groundElevation:'100'});
 assert.ok(terrain.valid&&fixed.valid);assert.equal(terrain.x1,fixed.x1);
 assert.ok(Math.abs(terrain.seal1!-96)<1e-12);assert.equal(fixed.h1,4);
 assert.ok(terrain.h1<4); // Local ground descends as the anchor moves away.
 assert.equal(calculate({...DEFAULTS,mode:'seal',target:'96'}).valid,false);
});

test('K adds an alignment allowance without changing excavation or edge coordinates',()=>{
 const base=calculate({...DEFAULTS,k:'0'});
 for(const k of ['0.1','0,2','0.35']){
  const adjusted=calculate({...DEFAULTS,k});
  assert.ok(adjusted.valid);
  assert.equal(adjusted.distanceTotal,base.distance+number(k));
  assert.equal(adjusted.x1,base.x1);assert.equal(adjusted.h1,base.h1);
  assert.equal(adjusted.deltaX,base.deltaX);assert.equal(adjusted.distance,base.distance);
  assert.deepEqual(adjusted.plan,base.plan);
 }
 assert.equal(base.distanceTotal,base.distance);
 for(const k of ['','abc','-0.1'])assert.equal(calculate({...DEFAULTS,k}).valid,false);
});

test('saved cases without K migrate to 0.1 and explicit values survive JSON round trips',()=>{
 const {k:_,...previous}=DEFAULTS;
 assert.deepEqual(readInputs(previous),DEFAULTS);
 for(const k of ['0','0.2'])assert.equal(readInputs(JSON.parse(JSON.stringify({...DEFAULTS,k})))?.k,k);
 assert.equal(readInputs({...DEFAULTS,k:null}),null);
});
