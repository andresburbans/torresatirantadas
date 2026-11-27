import data from '../data/tower-references.json';
import { GUYS, type Coord, type RefId, type TowerProject } from './tower';
import { updateSurveyCoordinate } from './survey';

export type TowerReference={id:string;tower:string;ref:RefId|null;n:string;e:string;z:string;description:string;date:string};
/** Original descriptions and decimal strings are retained, including unidentified points. */
export const TOWER_REFERENCES=data as TowerReference[];
export const REFERENCE_TOWERS=[...new Set(TOWER_REFERENCES.map(r=>r.tower))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
export function normalizeTowerId(value:string){
  const raw=value.trim().toUpperCase().replace(/^T\s*#?\s*|^#\s*/,'');
  return /^\d+[A-Z]?$/.test(raw)?`T${raw.replace(/^0+(?=\d)/,'')}`:'';
}
export function referencesFor(tower:string,ref?:RefId){
  const id=normalizeTowerId(tower);
  return TOWER_REFERENCES.filter(r=>r.tower===id&&(ref===undefined||r.ref===ref));
}
export function searchTowers(query:string){
  const id=normalizeTowerId(query);
  return id?REFERENCE_TOWERS.filter(t=>t.startsWith(id)).sort((a,b)=>Number(b===id)-Number(a===id)):[];
}
export function matchingReference(tower:string,ref:RefId,coord:Coord){
  return referencesFor(tower,ref).find(r=>r.n===coord.n&&r.e===coord.e&&r.z===coord.z);
}
function replaceReference(p:TowerProject,ref:RefId,row?:TowerReference):TowerProject {
  const coord:Coord=row?{n:row.n,e:row.e,z:row.z}:{n:'',e:'',z:''};
  let next=p;
  for(const axis of ['n','e','z'] as const)next=updateSurveyCoordinate(next,ref,axis,coord[axis]);
  return next;
}
/** Only a uniquely identified RF is automatic. Missing/ambiguous RFs never inherit another tower's data. */
export function loadTowerReferences(p:TowerProject,tower:string,custom:CustomTower[]=[]):TowerProject {
  const id=normalizeTowerId(tower);
  const added=REFERENCE_TOWERS.includes(id)?undefined:custom.find(t=>t.tower===id);
  if(!REFERENCE_TOWERS.includes(id)&&!added)return p;
  let next={...p,id};
  for(const ref of ['R41','R32'] as const){
    const rows=referencesFor(id,ref);
    const row=added?{...added[ref],id:'',tower:id,ref,description:'',date:''}:rows.length===1?rows[0]:undefined;
    next=replaceReference(next,ref,row);
  }
  return clearTowerWork(p,next,id);
}
/** A different tower requires a fresh observation even if two benchmark elevations match. */
function clearTowerWork(p:TowerProject,next:TowerProject,id:string):TowerProject {
  if(normalizeTowerId(p.id)!==id){
    const guys={...next.guys};
    for(const guy of GUYS){
      const g=guys[guy];
      guys[guy]={...g,c:'',sealDesign:'',groundElevation:'',target:g.mode==='seal'?'':g.target};
    }
    next={...next,guys,mast:{...next.mast,sealDesign:'',sealTarget:''},survey:{...next.survey,backsight:'',baselineDistance:''}};
  }
  return next;
}

/** Torres que no están en el catálogo, agregadas en este dispositivo con sus amarres manuales. */
export type CustomTower={tower:string;R41:Coord;R32:Coord};
export const CUSTOM_TOWERS_STORAGE='rumbo3d-custom-towers-v1';
const isCoord=(v:unknown):v is Coord=>!!v&&typeof v==='object'&&['n','e','z'].every(k=>typeof (v as Record<string,unknown>)[k]==='string');
export function readCustomTowers(raw:unknown):CustomTower[] {
  if(!Array.isArray(raw))return [];
  const seen=new Set<string>();
  return raw.flatMap(item=>{
    if(!item||typeof item!=='object')return [];
    const v=item as Record<string,unknown>,id=typeof v.tower==='string'?normalizeTowerId(v.tower):'';
    if(!id||REFERENCE_TOWERS.includes(id)||seen.has(id)||!isCoord(v.R41)||!isCoord(v.R32))return [];
    seen.add(id);
    return [{tower:id,R41:{n:v.R41.n,e:v.R41.e,z:v.R41.z},R32:{n:v.R32.n,e:v.R32.e,z:v.R32.z}}];
  });
}
/** «Agregar torre» solo procede con un número válido que no exista en el catálogo. */
export function canAddTower(query:string,custom:CustomTower[]=[]){
  const id=normalizeTowerId(query);
  return id!==''&&!REFERENCE_TOWERS.includes(id)&&!custom.some(t=>t.tower===id)?id:null;
}
/** Crea la torre con amarres vacíos para ingresarlos manualmente; limpia C y sellos de la torre anterior. */
export function addTower(p:TowerProject,query:string,custom:CustomTower[]):{project:TowerProject;custom:CustomTower[]}|null {
  const id=canAddTower(query,custom);
  if(!id)return null;
  let next={...p,id};
  for(const ref of ['R41','R32'] as const)next=replaceReference(next,ref);
  const blank={n:'',e:'',z:''};
  return {project:clearTowerWork(p,next,id),custom:[...custom,{tower:id,R41:{...blank},R32:{...blank}}]};
}
/** Mantiene en la lista local los amarres editados de la torre agregada que está abierta. */
export function syncCustomTower(custom:CustomTower[],p:TowerProject):CustomTower[] {
  const id=normalizeTowerId(p.id),index=custom.findIndex(t=>t.tower===id);
  if(index<0)return custom;
  const {R41,R32}=p.survey.coords,current=custom[index];
  if(['n','e','z'].every(k=>current.R41[k as keyof Coord]===R41[k as keyof Coord]&&current.R32[k as keyof Coord]===R32[k as keyof Coord]))return custom;
  return custom.map((t,i)=>i===index?{tower:id,R41:{...R41},R32:{...R32}}:t);
}
export function searchAllTowers(query:string,custom:CustomTower[]){
  const id=normalizeTowerId(query);
  if(!id)return [];
  const extra=custom.map(t=>t.tower).filter(t=>t.startsWith(id));
  return [...searchTowers(query),...extra].sort((a,b)=>Number(b===id)-Number(a===id));
}
export function selectTowerReference(p:TowerProject,ref:RefId,sourceId:string):TowerProject {
  const row=referencesFor(p.id,ref).find(r=>r.id===sourceId);
  return row?replaceReference(p,ref,row):p;
}
