import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, calculate, dms } from '../src/lib/geometry';
import { applyPreset, azimuth, hzDms, inputFor, leveling, newTower, normalize, orientation, phiFor, readTower, resultFor, sealFor, setPhi, GUYS, POINTS } from '../src/lib/tower';
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
