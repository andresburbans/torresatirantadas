import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreSession, STORAGE } from '../src/lib/session';
import { newTower } from '../src/lib/tower';

function memory(entries:Record<string,string>={}){
  const data=new Map(Object.entries(entries));
  return {data,getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
}
test('restores a valid session and never changes its saved data',()=>{
  const project=newTower(),raw=JSON.stringify(project),storage=memory({[STORAGE]:raw});
  const result=restoreSession(storage);
  assert.deepEqual(result.project,project);assert.equal(result.canSave,true);assert.equal(storage.data.size,1);
});
test('invalid JSON, incompatible data and empty sessions are backed up verbatim before autosave',()=>{
  for(const raw of ['{broken','{}','']){
    const storage=memory({[STORAGE]:raw}),result=restoreSession(storage);
    assert.equal(result.damaged,true);assert.equal(result.project,null);assert.equal(result.canSave,true);
    assert.equal(storage.getItem(result.recoveryKey!),raw);assert.equal(storage.getItem(STORAGE),raw);
  }
});
test('a different recovery copy or unavailable storage blocks autosave without deleting data',()=>{
  const storage=memory({[STORAGE]:'broken',[`${STORAGE}-recovery`]:'previous'});
  assert.equal(restoreSession(storage).canSave,false);assert.equal(storage.getItem(STORAGE),'broken');
  assert.equal(storage.getItem(`${STORAGE}-recovery`),'previous');
  const full={...memory({[STORAGE]:'broken'}),setItem:()=>{throw Error('quota');}};
  assert.equal(restoreSession(full).canSave,false);assert.equal(full.getItem(STORAGE),'broken');
});
test('legacy sessions migrate while missing storage starts a fresh session',()=>{
  const project=newTower(),storage=memory({'rumbo3d-tirantes-v1':JSON.stringify(project)});
  assert.equal(restoreSession(storage).legacy,true);assert.deepEqual(restoreSession(storage).project,project);
  assert.deepEqual(restoreSession(memory()),{project:null,legacy:false,damaged:false,canSave:true});
});
