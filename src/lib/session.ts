import { readTower, type TowerProject } from './tower';

export const STORAGE='rumbo3d-tirantes-tower-v2';
const LEGACY_STORAGE='rumbo3d-tirantes-v1';
type SessionStorage=Pick<Storage,'getItem'|'setItem'>;

/** Preserve unreadable input before the initial autosave can replace it. */
export function restoreSession(storage:SessionStorage):{
  project:TowerProject|null;legacy:boolean;damaged:boolean;canSave:boolean;recoveryKey?:string;
}{
  try{
    const saved=storage.getItem(STORAGE),raw=saved??storage.getItem(LEGACY_STORAGE);
    if(raw===null)return {project:null,legacy:false,damaged:false,canSave:true};
    let project:TowerProject|null=null;
    try{project=readTower(JSON.parse(raw));}catch{/* Invalid JSON must also be preserved. */}
    if(project)return {project,legacy:saved===null,damaged:false,canSave:true};
    const recoveryKey=`${STORAGE}-recovery`;
    const previous=storage.getItem(recoveryKey);
    // A different backup must remain recoverable as well: block autosave in that case.
    if(previous!==null&&previous!==raw)return {project:null,legacy:false,damaged:true,canSave:false};
    storage.setItem(recoveryKey,raw);
    return {project:null,legacy:false,damaged:true,canSave:true,recoveryKey};
  }catch{return {project:null,legacy:false,damaged:false,canSave:false};}
}
