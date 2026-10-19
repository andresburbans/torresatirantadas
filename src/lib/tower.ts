import { ALPHAS, CATALOG, type Soil, type Tower } from './catalog';
import { DEFAULTS, calculate, dms, number, readInputs, toDms, type DMS, type Inputs } from './geometry';

export const GUYS = ['1','2','3','4'] as const;
export const POINTS = [...GUYS,'M1'] as const;
export type GuyId = typeof GUYS[number];
export type PointId = typeof POINTS[number];
export type PivotId = 'E'|'F';
export type RefId = 'R41'|'R32';
export type Coord = { n:string; e:string; z:string };
export type GuyData = Pick<Inputs,'c'|'x0'|'h0'|'target'|'mode'|'datum'|'alpha'|'groundElevation'|'phi'|'soil'> & {
  phiLinked:boolean; sealDesign:string; staffCurrent:string;
};
export type TowerProject = {
  schema:2; id:string; tower:Tower; soil:Soil; referenceAlpha:string;
  pivot:string; k:string; beta:DMS;
  selected:PointId; diagramsVisible:boolean;
  guys:Record<GuyId,GuyData>;
  mast:{sealDesign:string;sealTarget:string;staffCurrent:string};
  survey:{mode:'coordinates'|'axis'; mapping:'F14'|'E14'; side:'standard'|'mirrored'; zero:RefId; levelRef:RefId; backsight:string; mastStation:PivotId;
    coords:Record<RefId|PivotId|'M1',Coord>};
};
const blankCoord=():Coord=>({n:'',e:'',z:''});
const zeroAngle:DMS={deg:'0',min:'0',sec:'0'};
export function newTower():TowerProject {
  const guys=Object.fromEntries(GUYS.map(id=>[id,{
    c:id==='1'?DEFAULTS.c:'',x0:DEFAULTS.x0,h0:DEFAULTS.h0,target:id==='1'?DEFAULTS.target:DEFAULTS.h0,
    mode:'depth',datum:'terrain',alpha:DEFAULTS.alpha,groundElevation:'',phi:{...DEFAULTS.phi},soil:'3',
    phiLinked:id!=='1',sealDesign:'',staffCurrent:'',
  }])) as Record<GuyId,GuyData>;
  return {schema:2,id:DEFAULTS.id,tower:DEFAULTS.tower,soil:'3',referenceAlpha:'5',pivot:DEFAULTS.pivot,k:DEFAULTS.k,beta:{...DEFAULTS.beta},
    selected:'1',diagramsVisible:false,guys,mast:{sealDesign:'',sealTarget:'',staffCurrent:''},
    survey:{mode:'coordinates',mapping:'F14',side:'standard',zero:'R41',levelRef:'R41',backsight:'',mastStation:'E',
      coords:{R41:blankCoord(),R32:blankCoord(),E:blankCoord(),F:blankCoord(),M1:blankCoord()}}};
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
export function pivotFor(p:TowerProject,id:PointId):PivotId {
  if(id==='M1')return p.survey.mastStation;
  const pair14=id==='1'||id==='4';
  return pair14?(p.survey.mapping==='F14'?'F':'E'):(p.survey.mapping==='F14'?'E':'F');
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
export function coordinates(c:Coord):{n:number;e:number}|null {
  const n=number(c.n),e=number(c.e);
  return Number.isFinite(n)&&Number.isFinite(e)?{n,e}:null;
}
/** Design φ is measured from the transverse axis, not from the backsight. */
export function localBearing(p:TowerProject,id:GuyId):number|null {
  const phi=dms(phiFor(p,id));
  if(!(phi>=0&&phi<90))return null;
  const east=(id==='3'||id==='4')!==(p.survey.side==='mirrored');
  const north=pivotFor(p,id)==='E';
  return east?(north?90-phi:90+phi):(north?270+phi:270-phi);
}
export function orientation(p:TowerProject,id:PointId){
  const station=pivotFor(p,id),errors:string[]=[];
  let targetAz:number|null=null,zeroAz:number|null=null,edge:{n:number;e:number}|null=null,range:number|null=null;
  if(p.survey.mode==='axis'){
    if(id==='M1')errors.push('Para orientar M1, usa coordenadas de pivotes y mástil.');
    else targetAz=localBearing(p,id);
    zeroAz=p.survey.zero==='R41'?0:180;
  }else{
    const e=coordinates(p.survey.coords.E),f=coordinates(p.survey.coords.F),ref=coordinates(p.survey.coords[p.survey.zero]);
    const occupied=station==='E'?e:f;
    if(!e||!f||!ref)errors.push('Completa N/E de E′, F′ y de la referencia elegida en Ajustes.');
    else {
      const axis=azimuth(f,e);
      zeroAz=azimuth(occupied!,ref);
      if(axis===null)errors.push('E′ y F′ no pueden coincidir.');
      if(zeroAz===null)errors.push('El punto de amarre no puede coincidir con la estación.');
      if(id==='M1'){
        const m=p.survey.coords.M1;
        const hasM=m.n.trim()!==''||m.e.trim()!=='';
        edge=hasM?coordinates(m):{n:(e.n+f.n)/2,e:(e.e+f.e)/2};
        if(!edge)errors.push('Completa ambas coordenadas N/E de M1 o deja ambas vacías para usar el punto medio.');
        else {targetAz=azimuth(occupied!,edge);range=Math.hypot(edge.n-occupied!.n,edge.e-occupied!.e);}
      }else{
        const local=localBearing(p,id),r=resultFor(p,id);
        if(axis!==null&&local!==null){
          targetAz=normalize(axis+local);
          if(r.valid){const rad=targetAz*Math.PI/180;edge={n:occupied!.n+r.distance*Math.cos(rad),e:occupied!.e+r.distance*Math.sin(rad)};range=r.distanceTotal;}
        }
      }
    }
  }
  if(targetAz===null&&errors.length===0)errors.push('Revisa φ o la posición del punto para calcular su dirección.');
  const hz=targetAz!==null&&zeroAz!==null&&errors.length===0?normalize(targetAz-zeroAz):null;
  return {station,hz,angle:hz===null?null:hzDms(hz),targetAz,zeroAz,edge,range,errors,
    convention:p.survey.mode==='axis'?'Por eje: R41 hacia E′; R32 hacia F′. Confirma que los amarres estén alineados.':'Por coordenadas N/E: giro horario desde la visual real al amarre.'};
}
export function sealFor(p:TowerProject,id:PointId):number|null {
  if(id==='M1'){
    const z=number(p.mast.sealTarget.trim()===''?p.mast.sealDesign:p.mast.sealTarget);
    return Number.isFinite(z)?z:null;
  }
  const input=inputFor(p,id);
  // Leveling does not require C, K, e or horizontal φ; validate vertical geometry separately.
  const vertical=calculate({...input,c:'1',k:'0',pivot:'0',phi:zeroAngle});
  return vertical.valid&&vertical.seal1!==null&&Number.isFinite(vertical.seal1)?vertical.seal1:null;
}
export function leveling(p:TowerProject,id:PointId){
  const errors:string[]=[],reference=number(p.survey.coords[p.survey.levelRef].z),backsight=number(p.survey.backsight);
  const seal=sealFor(p,id),raw=id==='M1'?p.mast.staffCurrent:p.guys[id].staffCurrent,current=raw.trim()===''?null:number(raw);
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
  if(!['id','referenceAlpha','pivot','k'].every(k=>typeof v[k]==='string')||!['GI6KL','G6KL','GR6KL'].includes(String(v.tower))||!['3','4'].includes(String(v.soil))||!isDms(v.beta)||!POINTS.includes(v.selected as PointId)||typeof v.diagramsVisible!=='boolean'||!record(v.guys)||!record(v.mast)||!record(v.survey))return null;
  const guys=v.guys,mast=v.mast,s=v.survey;
  for(const id of GUYS){const g=guys[id];if(!record(g)||!['c','x0','h0','target','alpha','groundElevation','sealDesign','staffCurrent'].every(k=>typeof g[k]==='string')||!isDms(g.phi)||typeof g.phiLinked!=='boolean'||!['3','4'].includes(String(g.soil))||!['fixed','terrain'].includes(String(g.datum))||!['depth','x','seal'].includes(String(g.mode)))return null;}
  if(!['sealDesign','sealTarget','staffCurrent'].every(k=>typeof mast[k]==='string')||!['coordinates','axis'].includes(String(s.mode))||!['F14','E14'].includes(String(s.mapping))||!['standard','mirrored'].includes(String(s.side))||!['R41','R32'].includes(String(s.zero))||!['R41','R32'].includes(String(s.levelRef))||!['E','F'].includes(String(s.mastStation))||typeof s.backsight!=='string'||!record(s.coords))return null;
  for(const key of ['E','F','R41','R32','M1']){const c=s.coords[key];if(!record(c)||!['n','e','z'].every(k=>typeof c[k]==='string'))return null;}
  // Only the validated schema is used by consumers; copying isolates imported objects.
  return structuredClone(v) as TowerProject;
}
