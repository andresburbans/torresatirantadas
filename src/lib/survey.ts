import { number } from './geometry';
import type { Coord, TowerProject } from './tower';

function ne(c:Coord){const n=number(c.n),e=number(c.e);return Number.isFinite(n)&&Number.isFinite(e)?{n,e}:null;}
/** Informational ratio only. Never feeds stakeout, geometry or leveling calculations. */
export function baselineScale(p:TowerProject){
  const a=ne(p.survey.coords.R41),b=ne(p.survey.coords.R32),errors:string[]=[];
  const raw=a&&b?Math.hypot(a.n-b.n,a.e-b.e):NaN;
  const theoretical=Number.isFinite(raw)&&raw>0?raw:null;
  if(theoretical===null)errors.push('Completa N/E de R41 y R32; los amarres deben ser distintos.');
  const measured=number(p.survey.baselineDistance);
  if(!(Number.isFinite(measured)&&measured>0))errors.push('Ingresa la distancia horizontal medida R41–R32, mayor que cero.');
  const ratio=errors.length===0?theoretical!/measured:null;
  const computed=ratio===null?NaN:ratio;
  if(ratio!==null&&!(Number.isFinite(computed)&&computed>0))errors.push('Los valores no permiten calcular un factor finito positivo.');
  const valid=errors.length===0;
  return {theoretical,measured:Number.isFinite(measured)?measured:null,
    factor:valid?computed:null,valid,errors};
}


export function updateSurveyCoordinate(p:TowerProject,id:keyof TowerProject['survey']['coords'],key:keyof Coord,value:string):TowerProject {
  if(p.survey.coords[id]?.[key]===value)return p;
  const reference=id==='R41'||id==='R32';
  const coords={...p.survey.coords,[id]:{...p.survey.coords[id],[key]:value}};
  if(id==='MC'||id==='M1'){
    coords.MC={...(coords.MC??p.survey.coords.MC),[key]:value};
    coords.M1={...(coords.M1??p.survey.coords.M1),[key]:value};
  }
  return {...p,survey:{...p.survey,
    baselineDistance:reference&&key!=='z'?'':p.survey.baselineDistance,
    backsight:id===p.survey.levelRef&&key==='z'?'':p.survey.backsight,
    coords}};
}
