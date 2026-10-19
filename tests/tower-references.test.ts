import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newTower, readTower } from '../src/lib/tower';
import { loadTowerReferences, matchingReference, normalizeTowerId, referencesFor, REFERENCE_TOWERS, searchTowers, selectTowerReference, TOWER_REFERENCES } from '../src/lib/tower-references';

test('offline catalog retains all source points, precision, descriptions and dates',()=>{
  assert.equal(TOWER_REFERENCES.length,316);assert.equal(REFERENCE_TOWERS.length,148);
  assert.equal(new Set(TOWER_REFERENCES.map(r=>r.id)).size,316);
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
