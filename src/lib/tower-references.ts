import data from '../data/tower-references.json';
import type { Coord, RefId, TowerProject } from './tower';

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
  return {...p,survey:{...p.survey,coords:{...p.survey.coords,[ref]:coord},
    backsight:p.survey.levelRef===ref&&p.survey.coords[ref].z!==coord.z?'':p.survey.backsight}};
}
/** Only a uniquely identified RF is automatic. Missing/ambiguous RFs never inherit another tower's data. */
export function loadTowerReferences(p:TowerProject,tower:string):TowerProject {
  const id=normalizeTowerId(tower);
  if(!REFERENCE_TOWERS.includes(id))return p;
  let next={...p,id};
  for(const ref of ['R41','R32'] as const){
    const rows=referencesFor(id,ref);
    next=replaceReference(next,ref,rows.length===1?rows[0]:undefined);
  }
  // A different tower requires a fresh observation even if two benchmark elevations match.
  if(normalizeTowerId(p.id)!==id)next={...next,survey:{...next.survey,backsight:''}};
  return next;
}
export function selectTowerReference(p:TowerProject,ref:RefId,sourceId:string):TowerProject {
  const row=referencesFor(p.id,ref).find(r=>r.id===sourceId);
  return row?replaceReference(p,ref,row):p;
}
