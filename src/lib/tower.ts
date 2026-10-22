import { ALPHAS, CATALOG, type Soil, type Tower } from './catalog';
import { DEFAULTS, calculate, dms, number, readInputs, toDms, type DMS, type Inputs } from './geometry';

export const GUYS = ['1','2','3','4'] as const;
export const POINTS = [...GUYS,'MC'] as const;
export type GuyId = typeof GUYS[number];
export type PointId = typeof POINTS[number] | 'M1';
export type PivotId = 'E'|'F';
export type RefId = 'R41'|'R32';
export type Coord = { n:string; e:string; z:string };
export type GuyCornerSetup = {
  mode:'A'|'PL'; localFrame?:'line'|'station'; distanceA:string; stationAlong:string; stationRight:string; offset:string; useUtm:boolean;
};
export type GuyData = Pick<Inputs,'c'|'x0'|'h0'|'target'|'mode'|'datum'|'alpha'|'groundElevation'|'phi'|'soil'> & {
  phiLinked:boolean; sealDesign:string; staffCurrent:string; corners?:GuyCornerSetup;
};
export type PointStation = { station: PivotId; zero: RefId };
export type TowerProject = {
  schema:2; id:string; tower:Tower; soil:Soil; referenceAlpha:string;
  pivot:string; k:string; beta:DMS;
  selected:PointId; diagramsVisible:boolean; terrainVisible:boolean; workflow:'stakeout'|'level';
  guys:Record<GuyId,GuyData>;
  mast:{sealDesign:string;sealTarget:string;staffCurrent:string;offset?:string;useUtm?:boolean};
  survey:{mode:'coordinates'|'axis'; mapping:'F14'|'E14'; side:'standard'|'mirrored'; zero:RefId; levelRef:RefId; backsight:string; mastStation:PivotId; occupied:'auto'|PivotId; orientationVersion:2; baselineDistance:string;
    pointStations?:Partial<Record<PointId,PointStation>>;
    coords:Record<RefId|PivotId|'MC'|'M1',Coord>};
};
const blankCoord=():Coord=>({n:'',e:'',z:''});
const zeroAngle:DMS={deg:'0',min:'0',sec:'0'};
export function newTower():TowerProject {
  const guys=Object.fromEntries(GUYS.map(id=>[id,{
    c:id==='1'?DEFAULTS.c:'',x0:DEFAULTS.x0,h0:DEFAULTS.h0,target:DEFAULTS.h0,
    mode:'depth',datum:'terrain',alpha:DEFAULTS.alpha,groundElevation:'',phi:{...DEFAULTS.phi},soil:'3',
    phiLinked:id!=='1',sealDesign:'',staffCurrent:'',
  }])) as Record<GuyId,GuyData>;
  return {schema:2,id:DEFAULTS.id,tower:DEFAULTS.tower,soil:'3',referenceAlpha:'5',pivot:DEFAULTS.pivot,k:DEFAULTS.k,beta:{...DEFAULTS.beta},
    selected:'1',diagramsVisible:false,terrainVisible:false,workflow:'stakeout',guys,mast:{sealDesign:'',sealTarget:'',staffCurrent:'',offset:'0',useUtm:false},
    survey:{mode:'axis',mapping:'F14',side:'standard',zero:'R41',levelRef:'R41',backsight:'',mastStation:'E',occupied:'auto',orientationVersion:2,baselineDistance:'',
      pointStations:{},
      coords:{R41:blankCoord(),R32:blankCoord(),E:blankCoord(),F:blankCoord(),MC:blankCoord(),M1:blankCoord()}}};
}
export function phiFor(p:TowerProject,id:GuyId):DMS {return id!=='1'&&p.guys[id].phiLinked?p.guys['1'].phi:p.guys[id].phi;}
export function inputFor(p:TowerProject,id:GuyId):Inputs {
  const g=p.guys[id],seal=number(g.sealDesign),h0=number(g.h0);
  return {...DEFAULTS,...g,id:p.id,tower:p.tower,guy:id,pivot:p.pivot,k:p.k,beta:p.beta,phi:phiFor(p,id),
    groundElevation:Number.isFinite(seal)&&Number.isFinite(h0)?String(seal+h0):g.groundElevation};
}
export function resultFor(p:TowerProject,id:GuyId){return calculate(inputFor(p,id));}
export function setPhi(p:TowerProject,id:GuyId,phi:DMS):TowerProject {
  return {...p,guys:{...p.guys,[id]:{...p.guys[id],phi,phiLinked:false}}};
}
/** A preset replaces its complete reference pair, retaining custom field targets. */
export function applyPreset(p:TowerProject,tower:Tower,soil:Soil,alpha:string,only?:GuyId):TowerProject {
  const index=ALPHAS.findIndex(a=>a===number(alpha));
  if(index<0)return p;
  const table=CATALOG[tower][soil];
  const guys={...p.guys};
  for(const id of only?[only]:GUYS){
    const g=guys[id];
    const followsDesign=g.mode==='depth'&&number(g.target)===number(g.h0);
    guys[id]={...g,soil,alpha,x0:String(table.x[index]),h0:String(table.h),datum:'terrain',target:followsDesign?String(table.h):g.target};
  }
  return {...p,tower,soil:only?p.soil:soil,referenceAlpha:alpha,beta:toDms(CATALOG[tower].beta),guys};
}

export function defaultStationFor(p:TowerProject,id:PointId):PivotId {
  if(id==='MC'||id==='M1')return p.survey.mastStation??'E';
  const pair14=id==='1'||id==='4';
  return pair14?(p.survey.mapping==='F14'?'F':'E'):(p.survey.mapping==='F14'?'E':'F');
}

export function defaultZeroFor(p:TowerProject,id:PointId,station?:PivotId):RefId {
  if(id==='MC'||id==='M1'){
    const st=station??stationFor(p,id);
    return st==='E'?'R41':'R32';
  }
  return p.survey.zero??'R41';
}

export function stationFor(p:TowerProject,id:PointId):PivotId {
  return occupiedPivotFor(p,id);
}

export function zeroFor(p:TowerProject,id:PointId):RefId {
  const normId:PointId=id==='M1'?'MC':id;
  const custom=p.survey.pointStations?.[normId]?.zero??p.survey.pointStations?.[id]?.zero;
  if(custom)return custom;
  return defaultZeroFor(p,normId);
}

export function setPointStation(p:TowerProject,id:PointId,station:PivotId):TowerProject {
  const normId:PointId=id==='M1'?'MC':id;
  const isMast=normId==='MC';
  const curZero=zeroFor(p,id);
  const nextZero=isMast?(station==='E'?'R41':'R32'):curZero;
  const pointStations={...(p.survey.pointStations??{})};
  pointStations[normId]={station,zero:nextZero};
  if(normId==='MC')pointStations['M1']={station,zero:nextZero};
  return {
    ...p,
    survey:{
      ...p.survey,
      mastStation:isMast?station:p.survey.mastStation,
      pointStations
    }
  };
}

export function setPointZero(p:TowerProject,id:PointId,zero:RefId):TowerProject {
  const normId:PointId=id==='M1'?'MC':id;
  const curStation=stationFor(p,id);
  const pointStations={...(p.survey.pointStations??{})};
  pointStations[normId]={station:curStation,zero};
  if(normId==='MC')pointStations['M1']={station:curStation,zero};
  return {
    ...p,
    survey:{
      ...p.survey,
      pointStations
    }
  };
}

export function pivotFor(p:TowerProject,id:PointId):PivotId {
  if(id==='MC'||id==='M1')return p.survey.mastStation??'E';
  const pair14=id==='1'||id==='4';
  return pair14?(p.survey.mapping==='F14'?'F':'E'):(p.survey.mapping==='F14'?'E':'F');
}
export function occupiedPivotFor(p:TowerProject,id:PointId):PivotId {
  const normId:PointId=id==='M1'?'MC':id;
  const custom=p.survey.pointStations?.[normId]?.station??p.survey.pointStations?.[id]?.station;
  if(custom)return custom;
  return p.survey.occupied==='E'||p.survey.occupied==='F'?p.survey.occupied:defaultStationFor(p,normId);
}
/** Explicit soil selection starts at the approved reference; later field adjustments remain possible. */
export function selectSoil(p:TowerProject,soil:Soil,only?:GuyId):TowerProject {
  const next=applyPreset(p,p.tower,soil,p.referenceAlpha,only),guys={...next.guys};
  for(const id of only?[only]:GUYS)guys[id]={...guys[id],mode:'depth',target:guys[id].h0};
  return {...next,guys};
}
export const normalize=(degrees:number)=>((degrees%360)+360)%360;
export function hzDms(degrees:number):DMS {
  const rounded=(Math.round(normalize(degrees)*360000)%129600000)/360000;
  return toDms(rounded);
}
export function azimuth(from:{n:number;e:number},to:{n:number;e:number}):number|null {
  const dn=to.n-from.n,de=to.e-from.e;
  return Math.hypot(dn,de)<1e-8?null:normalize(Math.atan2(de,dn)*180/Math.PI);
}
export function coordinates(c:Coord|undefined):{n:number;e:number}|null {
  if(!c)return null;
  const n=number(c.n),e=number(c.e);
  return Number.isFinite(n)&&Number.isFinite(e)?{n,e}:null;
}
/** Design φ is measured from the transverse axis, not from the backsight. */
export function localBearing(p:TowerProject,id:GuyId):number|null {
  const phi=dms(phiFor(p,id));
  if(!(phi>=0&&phi<90))return null;
  const east=(id==='3'||id==='4')!==(p.survey.side==='mirrored');
  const towardPositiveY=pivotFor(p,id)==='E';
  return east?(towardPositiveY?90-phi:90+phi):(towardPositiveY?270+phi:270-phi);
}
export function orientation(p:TowerProject,id:PointId){
  const isMast=id==='MC'||id==='M1';
  const normId:PointId=isMast?'MC':id;
  const designStation=pivotFor(p,id),station=occupiedPivotFor(p,id),errors:string[]=[];
  const customZero=p.survey.pointStations?.[normId]?.zero??p.survey.pointStations?.[id]?.zero;
  const zero=customZero??(isMast?(station==='E'?'R41':'R32'):p.survey.zero??'R41');
  let targetAz:number|null=null,zeroAz:number|null=null,edge:{n:number;e:number}|null=null,range:number|null=null;
  if(p.survey.mode==='axis'){
    if(isMast){
      const e=number(p.pivot);
      if(!Number.isFinite(e)||e<=0)errors.push('Completa Dist MC → cada pivote en Ajustes.');
      else {
        targetAz=station==='E'?0:180;
        zeroAz=zero==='R41'?0:180;
        range=e;
      }
    }else {
      const local=localBearing(p,id as GuyId),r=resultFor(p,id as GuyId),e=number(p.pivot);
      if(station===designStation){targetAz=local;if(r.valid)range=r.distanceTotal;}
      else if(local!==null&&r.valid&&Number.isFinite(e)&&e>=0){
        const rad=local*Math.PI/180,x=r.distance*Math.sin(rad),y=(designStation==='E'?e:-e)+r.distance*Math.cos(rad)-(station==='E'?e:-e);
        targetAz=azimuth({n:0,e:0},{n:y,e:x});range=Math.hypot(x,y)+number(p.k);
      }else errors.push('Completa C, e y el ajuste del tirante para medir desde el otro pivote.');
      if(targetAz!==null)targetAz=normalize(targetAz+180);
      zeroAz=zero==='R41'?0:180;
    }
  }else{
    const e=coordinates(p.survey.coords.E),f=coordinates(p.survey.coords.F),ref=coordinates(p.survey.coords[zero]);
    const occupied=station==='E'?e:f;
    if(!ref)errors.push('Completa N/E de la referencia elegida en Ajustes.');
    if(!e||!f)errors.push('Completa N/E de E′ y F′ en Ajustes.');
    else {
      const axis=azimuth(f,e);
      zeroAz=ref?azimuth(occupied!,ref):null;
      if(axis===null)errors.push('E′ y F′ no pueden coincidir.');
      if(ref&&zeroAz===null)errors.push('El punto de amarre no puede coincidir con la estación.');
      if(isMast){
        const m=(p.survey.coords.MC?.n.trim()||p.survey.coords.MC?.e.trim())
          ?p.survey.coords.MC
          :(p.survey.coords.M1?.n.trim()||p.survey.coords.M1?.e.trim())
          ?p.survey.coords.M1
          :p.survey.coords.MC??p.survey.coords.M1;
        const hasM=m&&(m.n.trim()!==''||m.e.trim()!=='');
        edge=hasM?coordinates(m):{n:(e.n+f.n)/2,e:(e.e+f.e)/2};
        if(!edge)errors.push('Completa ambas coordenadas N/E de MC o deja ambas vacías para usar el punto medio.');
        else {targetAz=azimuth(occupied!,edge);range=Math.hypot(edge.n-occupied!.n,edge.e-occupied!.e);}
      }else{
        const local=localBearing(p,id as GuyId),r=resultFor(p,id as GuyId);
        if(axis!==null&&local!==null){
          const designAz=normalize(axis+local),designPivot=designStation==='E'?e:f;
          if(station===designStation)targetAz=designAz;
          if(r.valid){const rad=designAz*Math.PI/180;edge={n:designPivot.n+r.distance*Math.cos(rad),e:designPivot.e+r.distance*Math.sin(rad)};range=Math.hypot(edge.n-occupied!.n,edge.e-occupied!.e)+number(p.k);targetAz=azimuth(occupied!,edge);}
        }
      }
    }
  }
  if(targetAz===null&&errors.length===0)errors.push('Revisa φ o la posición del punto para calcular su dirección.');
  const hz=targetAz!==null&&zeroAz!==null&&errors.length===0?normalize(targetAz-zeroAz):null;
  return {station,designStation,hz,angle:hz===null?null:hzDms(hz),targetAz,zeroAz,edge,range,errors,
    convention:p.survey.mode==='axis'?`Por cuadrantes: 0° en ${zero} · giro horario.`:`Por coordenadas N/E: 0° en ${zero} · giro horario.`};
}
export function excavationControl(remaining:number|null,valid:boolean){
  if(!valid||remaining===null||!Number.isFinite(remaining))return {label:'Control de excavación',sign:'',direction:null,value:null} as const;
  if(Math.abs(remaining)<.0005)return {label:'En sello',sign:'',direction:null,value:0} as const;
  return remaining>0?{label:'Falta excavar',sign:'+',direction:'down',value:remaining} as const:{label:'Exceso de excavación',sign:'−',direction:'up',value:Math.abs(remaining)} as const;
}
export function sealFor(p:TowerProject,id:PointId):number|null {
  if(id==='MC'||id==='M1'){
    const z=number(p.mast.sealTarget.trim()===''?p.mast.sealDesign:p.mast.sealTarget);
    return Number.isFinite(z)?z:null;
  }
  const input=inputFor(p,id as GuyId);
  // Leveling does not require C, K, e or horizontal φ; validate vertical geometry separately.
  const vertical=calculate({...input,c:'1',k:'0',pivot:'0',phi:zeroAngle});
  return vertical.valid&&vertical.seal1!==null&&Number.isFinite(vertical.seal1)?vertical.seal1:null;
}
export function leveling(p:TowerProject,id:PointId){
  const isMast=id==='MC'||id==='M1';
  const errors:string[]=[],reference=number(p.survey.coords[p.survey.levelRef].z),backsight=number(p.survey.backsight);
  const seal=sealFor(p,id),raw=isMast?p.mast.staffCurrent:p.guys[id as GuyId].staffCurrent,current=raw.trim()===''?null:number(raw);
  const hi=Number.isFinite(reference)&&Number.isFinite(backsight)&&backsight>=0?reference+backsight:null;
  if(hi===null)errors.push('Ingresa Z de la referencia del nivel y su vista (+), mayor o igual que cero.');
  if(seal===null)errors.push('Ingresa la cota de sello y revisa el ajuste vertical del punto.');
  if(current!==null&&!(Number.isFinite(current)&&current>=0))errors.push('La vista actual debe ser un número mayor o igual que cero.');
  const staff=hi!==null&&seal!==null?hi-seal:null;
  if(staff!==null&&staff<0)errors.push('El sello está sobre el plano de colimación: cambia la posición del nivel para una mira vertical normal.');
  const remaining=staff!==null&&current!==null&&Number.isFinite(current)&&current>=0?staff-current:null;
  return {hi,seal,staff,current,remaining,ground:hi!==null&&current!==null&&Number.isFinite(current)&&current>=0?hi-current:null,errors,
    valid:errors.length===0};
}
export function localPlan(p:TowerProject){
  const e=number(p.pivot);
  return GUYS.map(id=>{
    const r=resultFor(p,id),bearing=localBearing(p,id),station=pivotFor(p,id);
    if(!r.valid||bearing===null||!Number.isFinite(e))return {id,position:null,station};
    const rad=bearing*Math.PI/180;
    return {id,station,position:{x:r.distance*Math.sin(rad),y:(station==='E'?e:-e)+r.distance*Math.cos(rad)}};
  });
}

export function calculatePivotsFromMast(coords:Record<string,Coord>,pivotDist:number):{E:{n:string;e:string};F:{n:string;e:string}}|null {
  const r41=coordinates(coords.R41);
  const r32=coordinates(coords.R32);
  const mc=coordinates(coords.MC??coords.M1);
  if(!r41||!r32||!mc||!Number.isFinite(pivotDist)||pivotDist<=0)return null;
  const dn=r41.n-r32.n,de=r41.e-r32.e;
  const dist=Math.hypot(dn,de);
  if(dist<1e-6)return null;
  const un=dn/dist,ue=de/dist;
  const fn=mc.n+pivotDist*un,fe=mc.e+pivotDist*ue;
  const en=mc.n-pivotDist*un,ee=mc.e-pivotDist*ue;
  return {
    F:{n:fn.toFixed(3),e:fe.toFixed(3)},
    E:{n:en.toFixed(3),e:ee.toFixed(3)}
  };
}

export type MastCorner={id:string;n:number;e:number};

export function mastCorners(p:TowerProject,offset:number=0,useUtm:boolean=false):MastCorner[]{
  const distance=number(p.pivot),half=1.4+offset;
  if(!Number.isFinite(offset)||half<=0)return [];
  // Fixed physical numbering from the sketch: NE, SE, SW, NW in the tower frame.
  const corners=[
    {id:'MC1',ax:half,tr:half}, {id:'MC2',ax:-half,tr:half},
    {id:'MC3',ax:-half,tr:-half}, {id:'MC4',ax:half,tr:-half},
  ];
  if(useUtm){
    const mc=coordinates(p.survey.coords.MC??p.survey.coords.M1);
    const r41=coordinates(p.survey.coords.R41),r32=coordinates(p.survey.coords.R32);
    if(!mc||!r41||!r32)return [];
    const dn=r41.n-r32.n,de=r41.e-r32.e,length=Math.hypot(dn,de);
    if(length<1e-6)return [];
    const un=dn/length,ue=de/length;
    return corners.map(c=>({id:c.id,n:mc.n+c.ax*un-c.tr*ue,e:mc.e+c.ax*ue+c.tr*un}));
  }
  if(!Number.isFinite(distance)||distance<=0)return [];
  const station=stationFor(p,'MC'),zero=zeroFor(p,'MC');
  // Local north follows the zero sight; local east is its clockwise perpendicular.
  const sign=zero==='R41'?1:-1,stationAx=station==='F'?distance:-distance;
  return corners.map(c=>({id:c.id,n:sign*(c.ax-stationAx),e:sign*c.tr}));
}

function isDms(v:unknown):v is DMS {return !!v&&typeof v==='object'&&['deg','min','sec'].every(k=>typeof (v as Record<string,unknown>)[k]==='string');}
function record(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
/** Accepts new tower files, old case exports, and the previous local session. */
export function readTower(value:unknown):TowerProject|null {
  if(!record(value))return null;
  const v=record(value.project)?value.project:value;
  if(v.schema!==2){
    const legacy=readInputs(value.schema===1?value.inputs:value);
    if(!legacy)return null;
    const row=ALPHAS.some(a=>a===number(legacy.alpha))?legacy.alpha:'5';
    const p=applyPreset(newTower(),legacy.tower,legacy.soil,row),id=legacy.guy as GuyId;
    const active={...p.guys[id]};
    for(const key of ['c','x0','h0','target','mode','datum','alpha','groundElevation','phi','soil'] as const)Object.assign(active,{[key]:legacy[key]});
    const seal=legacy.groundElevation.trim()===''?'':String(number(legacy.groundElevation)-number(legacy.h0));
    return {...p,id:legacy.id,tower:legacy.tower,soil:legacy.soil,pivot:legacy.pivot,k:legacy.k,beta:legacy.beta,selected:id,
      guys:{...p.guys,[id]:{...active,phiLinked:false,sealDesign:Number.isFinite(number(seal))?seal:'',staffCurrent:''}}};
  }
  if(!['id','referenceAlpha','pivot','k'].every(k=>typeof v[k]==='string')||!['GI6KL','G6KL','GR6KL'].includes(String(v.tower))||!['3','4'].includes(String(v.soil))||!isDms(v.beta)||(!POINTS.some(id=>id===v.selected)&&v.selected!=='M1')||typeof v.diagramsVisible!=='boolean'||!record(v.guys)||!record(v.mast)||!record(v.survey))return null;
  const guys=v.guys,mast=v.mast,s=v.survey;
  for(const id of GUYS){const g=guys[id];if(!record(g)||!['c','x0','h0','target','alpha','groundElevation','sealDesign','staffCurrent'].every(k=>typeof g[k]==='string')||!isDms(g.phi)||typeof g.phiLinked!=='boolean'||!['3','4'].includes(String(g.soil))||!['fixed','terrain'].includes(String(g.datum))||!['depth','x','seal'].includes(String(g.mode)))return null;}
  for(const id of GUYS){
    const setup=(guys[id] as Record<string,unknown>).corners;
    if(setup!==undefined&&(!record(setup)||(setup.mode!=='A'&&setup.mode!=='PL')||(setup.localFrame!==undefined&&setup.localFrame!=='line'&&setup.localFrame!=='station')||typeof setup.useUtm!=='boolean'||!['distanceA','stationAlong','stationRight','offset'].every(k=>typeof setup[k]==='string')))return null;
  }
  if(!['sealDesign','sealTarget','staffCurrent'].every(k=>typeof mast[k]==='string')||!['coordinates','axis'].includes(String(s.mode))||!['F14','E14'].includes(String(s.mapping))||!['standard','mirrored'].includes(String(s.side))||!['R41','R32'].includes(String(s.zero))||!['R41','R32'].includes(String(s.levelRef))||!['E','F'].includes(String(s.mastStation))||typeof s.backsight!=='string'||!record(s.coords))return null;
  for(const key of ['E','F','R41','R32']){const c=s.coords[key];if(!record(c)||!['n','e','z'].every(k=>typeof c[k]==='string'))return null;}
  const mcCoord=s.coords.MC??s.coords.M1;
  if(!record(mcCoord)||!['n','e','z'].every(k=>typeof mcCoord[k]==='string'))return null;
  if(v.workflow!==undefined&&v.workflow!=='stakeout'&&v.workflow!=='level'||v.terrainVisible!==undefined&&typeof v.terrainVisible!=='boolean'||s.occupied!==undefined&&s.occupied!=='auto'&&s.occupied!=='E'&&s.occupied!=='F'||s.orientationVersion!==undefined&&s.orientationVersion!==2)return null;
  if(s.baselineDistance!==undefined&&typeof s.baselineDistance!=='string')return null;
  // Migrate existing schema-2 sessions without dropping measurements or custom depths.
  const orientationDefaults=s.orientationVersion===undefined?{mode:'axis',occupied:'F',zero:'R41'}:{occupied:s.occupied??'F'};
  if(mast.offset!==undefined&&typeof mast.offset!=='string'||mast.useUtm!==undefined&&typeof mast.useUtm!=='boolean')return null;
  const pointStations:Partial<Record<PointId,PointStation>>={};
  if(s.pointStations!==undefined){
    if(!record(s.pointStations))return null;
    for(const [key,entry] of Object.entries(s.pointStations)){
      if(![...POINTS,'M1'].includes(key)||!record(entry)||!['E','F'].includes(String(entry.station))||!['R41','R32'].includes(String(entry.zero)))return null;
      pointStations[key as PointId]={station:entry.station as PivotId,zero:entry.zero as RefId};
    }
    if(!pointStations.MC&&pointStations.M1)pointStations.MC={...pointStations.M1};
  }else{
    // Recover the previous active selection; other points start at their design pivot.
    for(const id of POINTS){
      const station=id==='MC'?s.mastStation as PivotId:((id==='1'||id==='4')===(s.mapping==='F14')?'F':'E');
      pointStations[id]={station,zero:id==='MC'?(station==='E'?'R41':'R32'):(orientationDefaults.zero??s.zero) as RefId};
    }
    const selected=v.selected==='M1'?'MC':v.selected as PointId;
    if(s.orientationVersion===2&&(s.occupied==='E'||s.occupied==='F')){
      pointStations[selected]={station:s.occupied,zero:s.zero as RefId};
    }
  }
  const mastData={sealDesign:mast.sealDesign,sealTarget:mast.sealTarget,staffCurrent:mast.staffCurrent,offset:typeof mast.offset==='string'?mast.offset:'0',useUtm:Boolean(mast.useUtm)};
  return structuredClone({...v,selected:v.selected==='M1'?'MC':v.selected,mast:mastData,workflow:v.workflow??'stakeout',terrainVisible:v.terrainVisible??false,survey:{...s,...orientationDefaults,orientationVersion:2,baselineDistance:s.baselineDistance??'',pointStations,coords:{...s.coords,MC:s.coords.MC??s.coords.M1??blankCoord(),M1:s.coords.M1??s.coords.MC??blankCoord()}}}) as TowerProject;
}
