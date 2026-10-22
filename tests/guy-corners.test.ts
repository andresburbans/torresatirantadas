import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GuyCorners } from '../src/components/guy-corners';
import { guyCorners, guyCornerSetup, updateGuyCornerSetup } from '../src/lib/guy-corners';
import { GUYS, azimuth, localBearing, newTower, pivotFor, readTower, resultFor, setPointStation, setPointZero } from '../src/lib/tower';

const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function project(){
 let p=newTower();
 for(const id of GUYS){p.guys[id].c='26.219';p=updateGuyCornerSetup(p,id,{distanceA:'35'});}
 p.survey.coords.F={n:'6300000',e:'350000',z:''};
 p.survey.coords.E={n:'6299996.04',e:'349994.72',z:''};
 return p;
}

test('four guys use the sketch numbering, near 2 m face and 1 m outward depth including K',()=>{
 const p=project();
 for(const id of GUYS){
  const {corners,distance,pivot}=guyCorners(p,id),d=resultFor(p,id).distanceTotal;
  close(distance!,d);assert.equal(pivot,id==='1'||id==='4'?'F':'E');
  assert.deepEqual(corners.map(c=>c.id),[1,2,3,4].map(n=>`T${id}${n}`));
  assert.deepEqual(corners.map(c=>c.right),[1,-1,-1,1]);
  close(corners[0].n,35-d);close(corners[1].n,35-d);
  close(corners[2].n,34-d);close(corners[3].n,34-d);
  assert.deepEqual(corners.map(c=>c.e),[-1,1,1,-1]);
  close(Math.hypot(corners[0].n-corners[1].n,corners[0].e-corners[1].e),2);
  close(Math.hypot(corners[1].n-corners[2].n,corners[1].e-corners[2].e),1);
 }
});

test('outward offset expands every face; A inside the block is allowed with signed coordinates',()=>{
 let p=updateGuyCornerSetup(project(),'1',{offset:'0,10',distanceA:'1'});
 const data=guyCorners(p,'1'),d=data.distance!;
 close(data.corners[0].along,d-.1);close(data.corners[2].along,d+1.1);
 close(data.corners[0].e,-1.1);close(data.corners[2].e,1.1);
 assert.ok(data.corners.every(c=>c.n<0));
 const before=data.corners;p={...p,k:String(Number(p.k)+.2)};
 const after=guyCorners(p,'1').corners;
 after.forEach((c,i)=>{close(c.n,before[i].n-.2);close(c.e,before[i].e);});
});

test('SOUTH point-line outputs use P1 origin, N toward P2 and E positive right without requiring station position',()=>{
 const p=updateGuyCornerSetup(project(),'2',{mode:'PL',distanceA:'',stationAlong:'',stationRight:''});
 const data=guyCorners(p,'2');assert.deepEqual(data.errors,[]);
 data.corners.forEach(c=>{close(c.n,c.along);close(c.e,c.right);});
});

test('PL station-origin output rotates the frame to zero toward pivot from either side of line',()=>{
 for(const along of [-10,0,35])for(const right of [-3,3]){
  const p=updateGuyCornerSetup(project(),'1',{mode:'PL',localFrame:'station',stationAlong:String(along),stationRight:String(right)});
  const data=guyCorners(p,'1'),range=Math.hypot(along,right);
  assert.deepEqual(data.errors,[]);
  for(const c of data.corners){
   // Rotate output back to the Point-to-Line frame and recover the same physical vertex.
   close(along-c.n*along/range+c.e*right/range,c.along);
   close(right-c.n*right/range-c.e*along/range,c.right);
   close(Math.hypot(c.n,c.e),Math.hypot(c.along-along,c.right-right));
  }
 }
 const p=updateGuyCornerSetup(project(),'1',{mode:'PL',localFrame:'station',stationAlong:'35',stationRight:'0'});
 assert.deepEqual(guyCorners(p,'1').corners,guyCorners(project(),'1').corners);
});

test('UTM is projected on the rotated design axis and preserves dimensions, K, identities and offset in every quadrant',()=>{
 let p=project();const axis=azimuth({n:6300000,e:350000},{n:6299996.04,e:349994.72})!;
 for(const id of GUYS){
  p=updateGuyCornerSetup(p,id,{useUtm:true,offset:'0.03',distanceA:''});
  const data=guyCorners(p,id),origin=p.survey.coords[pivotFor(p,id)],theta=(axis+localBearing(p,id)!)*Math.PI/180;
  assert.deepEqual(data.errors,[]);
  for(const c of data.corners){
   close(c.n,Number(origin.n)+c.along*Math.cos(theta)-c.right*Math.sin(theta));
   close(c.e,Number(origin.e)+c.along*Math.sin(theta)+c.right*Math.cos(theta));
  }
  const [a,b,c]=data.corners;close(Math.hypot(a.n-b.n,a.e-b.e),2.06);close(Math.hypot(b.n-c.n,b.e-c.e),1.06);
  const previous=data.corners;
  p=updateGuyCornerSetup(p,id,{mode:'PL',localFrame:'station',stationAlong:'bad',stationRight:''});
  p=setPointZero(setPointStation(p,id,pivotFor(p,id)==='E'?'F':'E'),id,'R32');
  assert.deepEqual(guyCorners(p,id).corners,previous);
 }
});

test('corner settings are independent, saved with the tower, and old towers migrate without loss',()=>{
 let p=project();const old=newTower(),before=structuredClone(old);
 assert.deepEqual(readTower(old),old);assert.deepEqual(old,before);
 assert.equal(guyCornerSetup(old,'1').offset,'0');assert.equal(guyCornerSetup(old,'1').useUtm,false);
 p=updateGuyCornerSetup(p,'1',{offset:'.1',mode:'PL',stationAlong:'35',stationRight:'-3',localFrame:'station'});
 p=updateGuyCornerSetup(p,'4',{offset:'.03',distanceA:'40',useUtm:true});
 const restored=readTower({project:JSON.parse(JSON.stringify(p))})!;
 assert.deepEqual(restored,p);assert.equal(guyCornerSetup(restored,'2').offset,'0');
 for(const id of GUYS)assert.deepEqual(guyCorners(restored,id),guyCorners(p,id));
});

test('missing or invalid inputs never yield invented local or UTM vertices',()=>{
 let p=project();
 for(const offset of ['', '-.01','bad']){
  const q=updateGuyCornerSetup(p,'1',{offset});assert.equal(guyCorners(q,'1').corners.length,0);
 }
 for(const distanceA of ['', '0','-1','bad'])assert.equal(guyCorners(updateGuyCornerSetup(p,'1',{distanceA}),'1').corners.length,0);
 p=updateGuyCornerSetup(p,'1',{mode:'PL',localFrame:'station',stationAlong:'0',stationRight:'0'});
 assert.equal(guyCorners(p,'1').corners.length,0);
 p=updateGuyCornerSetup(p,'1',{useUtm:true});p.survey.coords.E={...p.survey.coords.F};
 assert.equal(guyCorners(p,'1').corners.length,0);
 p=project();p.guys['1'].c='';assert.equal(guyCorners(p,'1').corners.length,0);
 for(const bad of [null,[],{...guyCornerSetup(p,'2'),mode:'bad'},{...guyCornerSetup(p,'2'),localFrame:'bad'},{...guyCornerSetup(p,'2'),offset:2}]){
  assert.equal(readTower({...p,guys:{...p.guys,'2':{...p.guys['2'],corners:bad}}}),null);
 }
});

test('results panel identifies the coordinate origin and shows only measurements needed by the selected frame',()=>{
 let p=project();
 const render=()=>renderToStaticMarkup(createElement(GuyCorners,{project:p,id:'1',change:()=>{}}));
 let html=render();assert.match(html,/Origen T1-A \(0,0\)/);assert.match(html,/guy-1-distance-a/);assert.match(html,/T14/);
 p=updateGuyCornerSetup(p,'1',{mode:'PL'});
 html=render();assert.match(html,/Punto–Línea · origen F′/);assert.doesNotMatch(html,/guy-1-station-n/);
 p=updateGuyCornerSetup(p,'1',{localFrame:'station'});
 html=render();assert.match(html,/guy-1-station-n/);assert.match(html,/guy-1-station-e/);
 p=updateGuyCornerSetup(p,'1',{useUtm:true});
 html=render();assert.match(html,/Norte UTM/);assert.doesNotMatch(html,/guy-1-station-n/);assert.doesNotMatch(html,/Puedes usar directamente estas/);
});
