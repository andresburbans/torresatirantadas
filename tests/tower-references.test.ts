import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUYS, newTower, readTower, resultFor, sealFor } from '../src/lib/tower';
import { loadTowerReferences, matchingReference, normalizeTowerId, referencesFor, REFERENCE_TOWERS, searchTowers, selectTowerReference, TOWER_REFERENCES } from '../src/lib/tower-references';

test('changing T584 to T588 clears C and all seals, retaining angles and other configuration',()=>{
  const p=loadTowerReferences(newTower(),'584');p.mast.sealDesign='100';p.mast.sealTarget='99';p.mast.side='2';
  p.survey.backsight='1.5';p.survey.baselineDistance='100';
  for(const id of GUYS){p.guys[id].c='26';p.guys[id].sealDesign='100';p.guys[id].groundElevation='103.5';}
  p.guys['2'].mode='seal';p.guys['2'].target='98';
  const before=structuredClone(p),q=loadTowerReferences(p,'588');
  assert.deepEqual(p,before);assert.equal(q.id,'T588');
  for(const id of GUYS){
    assert.deepEqual(q.guys[id],{...p.guys[id],c:'',sealDesign:'',groundElevation:'',target:p.guys[id].mode==='seal'?'':p.guys[id].target});
    assert.equal(resultFor(q,id).valid,false);assert.equal(sealFor(q,id),null);
  }
  assert.deepEqual(q.mast,{...p.mast,sealDesign:'',sealTarget:''});assert.equal(sealFor(q,'MC'),null);
  assert.deepEqual(q.beta,p.beta);assert.equal(q.pivot,p.pivot);assert.equal(q.referenceAlpha,p.referenceAlpha);
  assert.equal(q.survey.backsight,'');assert.equal(q.survey.baselineDistance,'');
  assert.equal(q.survey.coords.R41.n,referencesFor('588','R41')[0].n);
  assert.deepEqual(loadTowerReferences(p,'t00584').guys,p.guys);
  assert.deepEqual(loadTowerReferences(p,'584').mast,p.mast);
  assert.equal(loadTowerReferences(p,'99999'),p);
});

test('November reference update adds twelve towers without duplicating prior points',()=>{
  for(const id of ['214','215','364','365','366','367','368','589','590','592','593','594']){
    const p=loadTowerReferences(newTower(),id);
    for(const ref of ['R41','R32'] as const){
      assert.equal(referencesFor(id,ref).length,1);assert.notEqual(p.survey.coords[ref].n,'');
    }
  }
  assert.deepEqual(loadTowerReferences(newTower(),'214').survey.coords.R41,{n:'7430232.687',e:'420626.518',z:'1218.116'});
  assert.deepEqual(loadTowerReferences(newTower(),'594').survey.coords.R32,{n:'7240353.680',e:'430620.100',z:'2445.353'});
  assert.equal(referencesFor('214','R41')[0].date,'02-nov-2026');
  assert.equal(referencesFor('594','R32')[0].date,'24-oct-2026');
  assert.equal(new Set(TOWER_REFERENCES.map(r=>JSON.stringify([r.tower,r.ref,r.n,r.e,r.z]))).size,TOWER_REFERENCES.length);
});

test('offline catalog retains all source points, precision, descriptions and dates',()=>{
  assert.equal(TOWER_REFERENCES.length,340);assert.equal(REFERENCE_TOWERS.length,160);
  assert.equal(new Set(TOWER_REFERENCES.map(r=>r.id)).size,340);
  assert.equal(TOWER_REFERENCES.filter(r=>r.ref===null).length,7);
  for(const r of TOWER_REFERENCES){
    for(const k of ['n','e','z'] as const)assert.match(r[k],/^\d+\.\d{3}$/);
    assert.match(r.tower,/^T\d+[A-Z]?$/);assert.ok(r.description.startsWith(r.tower));
    assert.ok(r.ref===null||r.ref==='R41'||r.ref==='R32');
  }
  const p=loadTowerReferences(newTower(),'T574');
  assert.deepEqual(p.survey.coords.R41,{n:'7250330.350',e:'430641.386',z:'2252.033'});
  assert.deepEqual(p.survey.coords.R32,{n:'7250277.301',e:'430645.250',z:'2253.679'});
  assert.equal(matchingReference('574','R41',p.survey.coords.R41)?.date,'03-oct-2026');
  assert.equal(referencesFor('216','R41')[0].n,'7429227.486');
  assert.equal(referencesFor('588','R32')[0].z,'2413.041');
});

test('search accepts tower numbers, T#, case and suffixed towers without merging T274 and T274A',()=>{
  for(const q of ['574','t574',' T # 574 ','#574','00574'])assert.equal(normalizeTowerId(q),'T574');
  assert.equal(normalizeTowerId('274a'),'T274A');assert.deepEqual(searchTowers('t274a'),['T274A']);
  assert.equal(referencesFor('274A','R41')[0].n,'7400157.605');
  assert.equal(referencesFor('274A','R32')[0].z,'978.075');
  assert.equal(searchTowers('32')[0],'T320');assert.ok(searchTowers('32').includes('T328'));
  assert.deepEqual(searchTowers('99999'),[]);assert.deepEqual(searchTowers(''),[]);
  assert.equal(normalizeTowerId('T574<script>'),'');
});

test('loading changes only ID and references, clears stale observations, and persists with existing schema',()=>{
  const p=newTower();p.survey.coords.E={n:'10',e:'20',z:'30'};p.guys['2'].c='24.9';p.mast.sealDesign='100';p.survey.backsight='1.5';
  const q=loadTowerReferences(p,'574');
  assert.equal(q.survey.backsight,'');assert.deepEqual(q.guys,p.guys);assert.deepEqual(q.mast,p.mast);
  assert.deepEqual(q.survey.coords.E,p.survey.coords.E);assert.equal(p.survey.backsight,'1.5');
  assert.deepEqual(readTower(JSON.parse(JSON.stringify(q))),q);
  q.survey.backsight='1.8';assert.equal(loadTowerReferences(q,'T574').survey.backsight,'1.8');
  assert.equal(loadTowerReferences(q,'T216').survey.backsight,'');
  assert.equal(loadTowerReferences(q,'T99999'),q);
});

test('ambiguous or missing references never inherit old coordinates or acquire invented labels',()=>{
  const p=loadTowerReferences(newTower(),'574');
  for(const id of ['251','476','480','321']){
    const q=loadTowerReferences(p,id);
    assert.deepEqual(q.survey.coords.R41,{n:'',e:'',z:''});assert.deepEqual(q.survey.coords.R32,{n:'',e:'',z:''});
  }
  const q=loadTowerReferences(p,'320');assert.equal(q.survey.coords.R41.n,'7378003.273');
  assert.equal(q.survey.coords.R32.n,'');assert.equal(referencesFor('321').filter(r=>r.ref===null).length,4);
  assert.equal(referencesFor('311').filter(r=>r.ref===null).length,1);
  for(const id of ['305','306','307','308','317','322','327','328']){
    const q=loadTowerReferences(p,id);assert.equal(referencesFor(id,'R41').length,2);assert.equal(referencesFor(id,'R32').length,2);
    assert.equal(q.survey.coords.R41.n,'');assert.equal(q.survey.coords.R32.n,'');
    const row=referencesFor(id,'R32')[1],chosen=selectTowerReference(q,'R32',row.id);
    assert.equal(chosen.survey.coords.R32.n,row.n);assert.equal(chosen.survey.coords.R32.z,row.z);
    assert.equal(selectTowerReference(q,'R41',row.id),q); // A RF32 cannot be selected as RF41.
  }
  const row=referencesFor('251','R41')[1],loaded=loadTowerReferences(p,'251');
  assert.equal(selectTowerReference(loaded,'R41',row.id).survey.coords.R41.n,row.n);
  assert.equal(selectTowerReference(loaded,'R41',referencesFor('574','R41')[0].id),loaded);
});
