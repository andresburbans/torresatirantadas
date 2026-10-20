import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baselineScale, updateSurveyCoordinate } from '../src/lib/survey';
import { GUYS, POINTS, leveling, localPlan, newTower, orientation, readTower, resultFor } from '../src/lib/tower';
import { loadTowerReferences, referencesFor, selectTowerReference } from '../src/lib/tower-references';

function baseline(){
  const p=newTower();
  p.survey.coords.R41={n:'1060',e:'1080',z:'100'};
  p.survey.coords.R32={n:'1000',e:'1000',z:'900'};
  p.survey.baselineDistance='99.99';
  return p;
}
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test('scale is measured / theoretical horizontal distance, without Z or rounding the baseline',()=>{
  const p=baseline(),s=baselineScale(p);
  assert.equal(s.theoretical,100);assert.equal(s.valid,true);close(s.factor!,0.9999);
  p.survey.coords.R41.z='';assert.deepEqual(baselineScale(p),s);
  p.survey.baselineDistance='100';assert.equal(baselineScale(p).factor,1);
  p.survey.baselineDistance='100,02';close(baselineScale(p).factor!,1.0002);
  p.survey.coords.R41.n='1001';p.survey.coords.R41.e='1001';
  close(baselineScale(p).factor!,100.02/Math.sqrt(2));
});

test('missing, nonpositive or invalid observations never expose a stale scale',()=>{
  const p=baseline();
  for(const raw of ['','0','-1','abc','NaN','Infinity','1e3']){
    p.survey.baselineDistance=raw;const s=baselineScale(p);
    assert.equal(s.theoretical,100);assert.equal(s.factor,null);assert.equal(s.valid,false);
  }
  p.survey.baselineDistance='99.99';
  for(const raw of ['','abc','Infinity']){
    p.survey.coords.R41.n=raw;assert.equal(baselineScale(p).factor,null);
  }
  p.survey.coords.R41={...p.survey.coords.R32};
  assert.equal(baselineScale(p).theoretical,null);assert.equal(baselineScale(p).valid,false);
});

test('scale observation persists, and old sessions gain only an empty observation',()=>{
  const p=baseline();assert.deepEqual(readTower({schema:2,project:JSON.parse(JSON.stringify(p))}),p);
  const old=JSON.parse(JSON.stringify(p));delete old.survey.baselineDistance;
  assert.deepEqual(readTower(old),{...p,survey:{...p.survey,baselineDistance:''}});
  assert.equal(readTower({...p,survey:{...p.survey,baselineDistance:99.99}}),null);
});

test('editing reference N/E clears measured distance; Z, M1, pivots and other parameters do not',()=>{
  const p=baseline();p.survey.backsight='1.5';
  assert.equal(updateSurveyCoordinate(p,'R41','n',p.survey.coords.R41.n),p);
  for(const ref of ['R41','R32'] as const)for(const axis of ['n','e'] as const){
    const q=updateSurveyCoordinate(p,ref,axis,'1234');
    assert.equal(q.survey.baselineDistance,'');assert.equal(q.survey.backsight,'1.5');
  }
  const z=updateSurveyCoordinate(p,'R41','z','101');
  assert.equal(z.survey.baselineDistance,'99.99');assert.equal(z.survey.backsight,'');
  for(const id of ['E','F','M1'] as const)for(const axis of ['n','e','z'] as const){
    assert.equal(updateSurveyCoordinate(p,id,axis,'1234').survey.baselineDistance,'99.99');
  }
  assert.equal(p.survey.baselineDistance,'99.99');
});

test('tower or alternative reference change clears old distance, identical catalog selection preserves it',()=>{
  const p=loadTowerReferences(baseline(),'574');p.survey.baselineDistance='53.18';
  assert.equal(loadTowerReferences(p,'574').survey.baselineDistance,'53.18');
  assert.equal(loadTowerReferences(p,'216').survey.baselineDistance,'');
  const row=referencesFor('574','R41')[0];
  assert.equal(selectTowerReference(p,'R41',row.id).survey.baselineDistance,'53.18');
  const q=loadTowerReferences(p,'305'),options=referencesFor('305','R41');
  const first=selectTowerReference(q,'R41',options[0].id);first.survey.baselineDistance='100';
  assert.equal(selectTowerReference(first,'R41',options[1].id).survey.baselineDistance,'');
});

test('scale is informational: all stakeout, terrain, angles, coordinates and leveling stay identical',()=>{
  const p=baseline();p.survey.coords.F={n:'1033',e:'1040',z:''};p.survey.coords.E={n:'1026.4',e:'1040',z:''};
  p.survey.backsight='1.5';p.mast.sealDesign='98';p.mast.staffCurrent='2.5';
  for(const id of GUYS){p.guys[id].c='26.219';p.guys[id].sealDesign='96.5';p.guys[id].staffCurrent='4';p.guys[id].target='4.2';}
  for(const mode of ['axis','coordinates'] as const)for(const station of ['E','F'] as const)for(const zero of ['R41','R32'] as const){
    p.survey.mode=mode;p.survey.occupied=station;p.survey.zero=zero;
    const before={geometry:GUYS.map(id=>resultFor(p,id)),orientation:POINTS.map(id=>orientation(p,id)),leveling:POINTS.map(id=>leveling(p,id)),plan:localPlan(p),coords:structuredClone(p.survey.coords)};
    for(const value of ['','99.99','100.02','800','bad']){
      p.survey.baselineDistance=value;baselineScale(p);
      assert.deepEqual({geometry:GUYS.map(id=>resultFor(p,id)),orientation:POINTS.map(id=>orientation(p,id)),leveling:POINTS.map(id=>leveling(p,id)),plan:localPlan(p),coords:p.survey.coords},before);
    }
  }
});
