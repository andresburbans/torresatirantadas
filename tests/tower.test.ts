import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, calculate, dms } from '../src/lib/geometry';
import { applyPreset, azimuth, excavationControl, hzDms, inputFor, leveling, newTower, normalize, occupiedPivotFor, orientation, phiFor, readTower, resultFor, sealFor, selectSoil, setPhi, GUYS, POINTS } from '../src/lib/tower';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function coordinateTower(){
 const p=newTower();p.survey.coords.E={n:'1006.6',e:'1000',z:''};p.survey.coords.F={n:'1000',e:'1000',z:''};
 p.survey.coords.R41={n:'1100',e:'1000',z:'100'};p.survey.coords.R32={n:'900',e:'1000',z:'101'};p.survey.backsight='1.5';
 return p;
}
test('tower migration preserves the active old case and leaves other C values unknown',()=>{
 const old={...DEFAULTS,guy:'3',target:'4.2',groundElevation:'100'};
 const p=readTower({schema:1,inputs:old})!;
 assert.ok(p);assert.equal(p.selected,'3');assert.equal(p.guys['3'].c,old.c);assert.equal(p.guys['2'].c,'');
 close(resultFor(p,'3').distanceTotal,calculate(old).distanceTotal);
 close(Number(p.guys['3'].sealDesign),96.5);
 assert.equal(inputFor(p,'3').target,'4.2');assert.deepEqual(readTower(JSON.parse(JSON.stringify(p))),p);
 assert.equal(readTower({...p,guys:{}}),null);assert.equal(readTower({}),null);
 const migrated=readTower({...old,tower:'G6KL',soil:'3'})!;
 assert.equal(migrated.guys['2'].h0,'3');assert.equal(migrated.guys['2'].x0,'1.822');
});
test('each point retains independent depth, C, seal and reading',()=>{
 const p=newTower();p.guys['2'].c='24';p.guys['2'].target='3.7';p.guys['1'].sealDesign='96.5';p.guys['2'].sealDesign='98';
 assert.equal(inputFor(p,'1').c,DEFAULTS.c);assert.equal(inputFor(p,'2').target,'3.7');assert.notEqual(sealFor(p,'1'),sealFor(p,'2'));
});
test('T2-T4 inherit T1 phi until individually overridden',()=>{
 let p=setPhi(newTower(),'1',{deg:'30',min:'0',sec:'0'});
 assert.equal(dms(phiFor(p,'2')),30);p=setPhi(p,'2',{deg:'31',min:'0',sec:'0'});
 p=setPhi(p,'1',{deg:'32',min:'0',sec:'0'});
 assert.equal(dms(phiFor(p,'2')),31);assert.equal(dms(phiFor(p,'3')),32);assert.equal(dms(phiFor(p,'4')),32);
});
test('presets use the correct family/soil pair and retain custom depth targets and seals',()=>{
 let p=newTower();p.guys['2'].target='3.5';p.guys['1'].target='4.2';p.guys['1'].sealDesign='96.5';
 p=applyPreset(p,'GI6KL','4','5');assert.equal(p.guys['1'].x0,'2.46');assert.equal(p.guys['1'].target,'4.2');assert.equal(p.guys['2'].target,'4');assert.equal(p.guys['1'].sealDesign,'96.5');
 p=applyPreset(p,'G6KL','3','5');assert.equal(p.guys['2'].h0,'3');assert.equal(p.guys['2'].target,'3');assert.equal(p.guys['1'].x0,'1.822');
});
test('clockwise Hz is correct in all four quadrants for both zero references',()=>{
 const p=coordinateTower();const north=[234.55,305.45,54.55,125.45];
 for(const [index,id] of GUYS.entries()){
  close(orientation(p,id).hz!,north[index]);p.survey.zero='R32';close(orientation(p,id).hz!,normalize(north[index]-180));p.survey.zero='R41';
 }
});
test('configurable mapping and transverse side reproduce the stated field example without a sign error',()=>{
 const p=newTower();p.survey.mode='axis';p.survey.mapping='E14';p.survey.side='mirrored';
 close(orientation(p,'1').hz!,90-35.45);close(orientation(p,'4').hz!,270+35.45);
 p.survey.zero='R32';close(orientation(p,'1').hz!,270-35.45);close(orientation(p,'4').hz!,90+35.45);
});
test('coordinate bearings work for oblique and off-axis backsights and preserve the physical edge',()=>{
 const p=coordinateTower();p.guys['1'].c='26.219';p.survey.coords.R41={n:'1090',e:'1040',z:'100'};
 const r=orientation(p,'1');close(r.hz!,normalize(234.55-Math.atan2(40,90)*180/Math.PI));
 const f=p.survey.coords.F;close(Math.hypot(r.edge!.n-Number(f.n),r.edge!.e-Number(f.e)),resultFor(p,'1').distance);
 p.k='0.4';assert.deepEqual(orientation(p,'1').edge,r.edge);
 assert.equal(orientation(newTower(),'1').hz,null);
 p.survey.coords.E={...p.survey.coords.F};assert.equal(orientation(p,'1').hz,null);
});
test('leveling computes five seal rod readings independently of missing C and independent from total station zero',()=>{
 const p=coordinateTower();
 for(const id of GUYS){p.guys[id].sealDesign='96.5';p.guys[id].target=p.guys[id].h0;}
 p.mast.sealDesign='98';p.mast.staffCurrent='2.5';p.guys['2'].staffCurrent='1.2';
 for(const id of GUYS){close(leveling(p,id).staff!,5);assert.ok(leveling(p,id).valid);}
 close(leveling(p,'M1').staff!,3.5);close(leveling(p,'M1').remaining!,1);close(leveling(p,'2').remaining!,3.8);
 p.survey.zero='R32';close(leveling(p,'2').staff!,5);
 p.survey.levelRef='R32';close(leveling(p,'2').staff!,6);
});
test('changing depth updates the effective seal, without changing its design elevation',()=>{
 const p=coordinateTower();p.guys['1'].sealDesign='96.5';
 const r=resultFor(p,'1');close(sealFor(p,'1')!,96.5-r.deltaX*Math.tan(r.beta*Math.PI/180));
 close(leveling(p,'1').staff!,101.5-sealFor(p,'1')!);assert.equal(p.guys['1'].sealDesign,'96.5');
});
test('invalid level data and seals above collimation are flagged; over-excavation is signed',()=>{
 const p=coordinateTower();p.mast.sealDesign='98';p.mast.staffCurrent='4';close(leveling(p,'M1').remaining!,-0.5);
 p.survey.backsight='-1';assert.equal(leveling(p,'M1').valid,false);p.survey.backsight='1.5';p.mast.sealTarget='102';assert.equal(leveling(p,'M1').valid,false);
 p.mast.staffCurrent='abc';assert.equal(leveling(p,'M1').remaining,null);
});
test('M1 uses explicit coordinates or the labeled pivot midpoint, and angles round at 360 degrees',()=>{
 const p=coordinateTower();close(orientation(p,'M1').range!,3.3);
 p.survey.coords.M1={n:'1003',e:'1001',z:''};close(orientation(p,'M1').range!,Math.hypot(3.6,1));
 assert.equal(azimuth({n:0,e:0},{n:0,e:0}),null);assert.equal(dms(hzDms(359.999999999)),0);
 assert.equal(POINTS.length,5);
});

test('changing occupied E/F preserves the designed edge and computes range and clockwise Hz from the actual station',()=>{
 const p=coordinateTower();for(const id of GUYS)p.guys[id].c='26.219';
 p.survey.coords.R41={n:'1090',e:'1040',z:'100'};
 for(const id of GUYS){
  const original=orientation(p,id);const edge=original.edge!;
  for(const occupied of ['E','F'] as const){
   const moved={...p,survey:{...p.survey,occupied}},actual=orientation(moved,id),station=p.survey.coords[occupied];
   assert.deepEqual(actual.edge,edge);
   close(actual.range!,Math.hypot(edge.n-Number(station.n),edge.e-Number(station.e))+Number(p.k));
   for(const zero of ['R41','R32'] as const){
    const result=orientation({...moved,survey:{...moved.survey,zero}},id),ref=p.survey.coords[zero];
    close(result.hz!,normalize(azimuth({n:Number(station.n),e:Number(station.e)},edge)!-azimuth({n:Number(station.n),e:Number(station.e)},{n:Number(ref.n),e:Number(ref.e)})!));
   }
  }
 }
});
test('aligned axis and coordinate modes agree from either occupied pivot; missing C cannot yield an opposite-pivot shot',()=>{
 const p=coordinateTower();for(const id of GUYS)p.guys[id].c='25';
 for(const occupied of ['E','F'] as const)for(const id of GUYS){
  const q={...p,survey:{...p.survey,occupied}},coord=orientation(q,id),axis=orientation({...q,survey:{...q.survey,mode:'axis'}},id);
  close(axis.hz!,coord.hz!);close(axis.range!,coord.range!);
 }
 p.survey.mode='axis';p.survey.occupied='E';p.guys['1'].c='';
 assert.equal(orientation(p,'1').hz,null);assert.equal(orientation(p,'1').range,null);
 p.survey.occupied='F';assert.notEqual(orientation(p,'1').hz,null);
});
test('missing backsight coordinates block Hz without hiding an independently known edge distance',()=>{
 const p=coordinateTower();p.survey.occupied='E';p.survey.coords.R41={n:'',e:'',z:'100'};
 const o=orientation(p,'1');assert.equal(o.hz,null);assert.ok(o.range!>0);assert.ok(o.edge);
 p.survey.coords.R41={n:'1100',e:'1000',z:'100'};
 assert.equal(orientation(p,'M1').station,'E');close(orientation(p,'M1').range!,3.3);
 p.survey.occupied='F';close(orientation(p,'M1').range!,3.3);
});
test('soil selection loads approved GI6KL alpha-5 depth and X for design and field target, leaving subsequent edits available',()=>{
 const p=newTower();p.guys['1'].target='4.2';p.guys['1'].mode='x';p.guys['2'].sealDesign='100';
 const s4=selectSoil(p,'4');
 for(const id of GUYS){assert.equal(s4.guys[id].h0,'4');assert.equal(s4.guys[id].x0,'2.46');assert.equal(s4.guys[id].target,'4');assert.equal(s4.guys[id].mode,'depth');}
 const s3=selectSoil(s4,'3');for(const id of GUYS){assert.equal(s3.guys[id].h0,'3.5');assert.equal(s3.guys[id].target,'3.5');assert.equal(s3.guys[id].x0,'2.117');}
 assert.equal(s3.guys['2'].sealDesign,'100');assert.equal(s3.guys['1'].c,p.guys['1'].c);
 s3.guys['1'].target='3.7';assert.equal(inputFor(s3,'1').target,'3.7');
 const only=selectSoil(s4,'3','2');assert.equal(only.guys['1'].target,'4');assert.equal(only.guys['2'].target,'3.5');
 const other=selectSoil({...p,tower:'G6KL'},'3');assert.equal(other.guys['1'].h0,'3');assert.equal(other.guys['1'].x0,'1.822');
});
test('legacy schema-2 sessions gain hidden terrain and work tabs without overwriting custom measurements',()=>{
 const old=JSON.parse(JSON.stringify(newTower()));delete old.workflow;delete old.terrainVisible;delete old.survey.occupied;
 old.guys['1'].target='4.2';old.guys['3'].staffCurrent='2.3';
 const restored=readTower(old)!;assert.equal(restored.workflow,'stakeout');assert.equal(restored.terrainVisible,false);assert.equal(restored.survey.occupied,'auto');
 assert.equal(restored.guys['1'].target,'4.2');assert.equal(restored.guys['3'].staffCurrent,'2.3');
 assert.equal(occupiedPivotFor(restored,'1'),'F');assert.equal(occupiedPivotFor(restored,'2'),'E');
 restored.workflow='level';restored.terrainVisible=true;restored.survey.occupied='F';assert.deepEqual(readTower(JSON.parse(JSON.stringify(restored))),restored);
 assert.equal(readTower({...restored,workflow:'bad'}),null);assert.equal(readTower({...restored,survey:{...restored.survey,occupied:'bad'}}),null);
 assert.equal(readTower({...restored,workflow:{toString:()=> 'level'}}),null);
});
test('excavation signs and arrows distinguish cut, excess, seal tolerance and incomplete data',()=>{
 assert.deepEqual(excavationControl(1,true),{label:'Falta excavar',sign:'+',direction:'down',value:1});
 assert.deepEqual(excavationControl(-.3,true),{label:'Exceso de excavación',sign:'−',direction:'up',value:.3});
 for(const value of [0,.0004,-.0004]){assert.equal(excavationControl(value,true).label,'En sello');assert.equal(excavationControl(value,true).direction,null);}
 for(const value of [null,NaN,1])assert.equal(excavationControl(value,false).value,null);
});
