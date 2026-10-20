'use client';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import notes from '@/data/release-notes.json';
import { APP_CREDIT, APP_VERSION } from '@/lib/app-info';
import { localDay, RELEASE_NOTICE_STORAGE, releaseNoticeState, shouldShowRelease, type ReleaseNoticeState } from '@/lib/release-notice';

const version=process.env.NEXT_PUBLIC_RELEASE_ID||notes.fallbackVersion;
export function ReleaseNotice({paused}:{paused:boolean}){
  const [open,setOpen]=useState(false),[muted,setMuted]=useState(false);
  const state=useRef<ReleaseNoticeState|null>(null),storageUnavailable=useRef(false),closeButton=useRef<HTMLButtonElement>(null);
  function save(value:ReleaseNoticeState){state.current=value;try{localStorage.setItem(RELEASE_NOTICE_STORAGE,JSON.stringify(value));}catch{storageUnavailable.current=true;}}
  useEffect(()=>{
    if(paused||open)return;
    function check(){
      const now=new Date();let raw:unknown=state.current;
      if(!storageUnavailable.current)try{const saved=localStorage.getItem(RELEASE_NOTICE_STORAGE);if(saved)raw=JSON.parse(saved);}catch{storageUnavailable.current=true;}
      const next=releaseNoticeState(raw,version,now);state.current=next;
      if(shouldShowRelease(next,now)){save({...next,lastShownDay:localDay(now)});setMuted(false);setOpen(true);}
    }
    check();
    const resume=()=>{if(document.visibilityState==='visible')check();};
    const timer=window.setInterval(resume,60000);
    document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);
    return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);};
  },[paused,open]);
  useEffect(()=>{
    if(!open||paused)return;
    const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';closeButton.current?.focus();
    function key(event:KeyboardEvent){
      if(event.key==='Escape'){event.preventDefault();setOpen(false);}
      if(event.key==='Tab'){
        const nodes=Array.from(document.querySelectorAll<HTMLElement>('[data-release-dialog] button,[data-release-dialog] input'));
        const first=nodes[0],last=nodes.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    }
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};
  },[open,paused]);
  if(!open||paused)return null;
  return <div className="modal-backdrop" onClick={()=>setOpen(false)}><section className="modal release-notice" data-release-dialog role="dialog" aria-modal="true" aria-labelledby="release-title" onClick={e=>e.stopPropagation()}>
    <button ref={closeButton} className="modal-close icon-button" aria-label="Cerrar novedades" onClick={()=>setOpen(false)}><X size={20}/></button>
    <h2 id="release-title">Nueva versión</h2>
    <span className="release-version" data-testid="release-version">Versión {APP_VERSION}</span>
    <ul className="release-changes">{notes.changes.map(text=><li key={text}>{text}</li>)}</ul>
    <label className="inherit-check"><input type="checkbox" checked={muted} onChange={e=>{setMuted(e.target.checked);if(state.current)save({...state.current,muted:e.target.checked});}}/>No volver a mostrar</label>
    <button className="button primary" onClick={()=>setOpen(false)}>Entendido</button>
    <p className="app-credit">{APP_CREDIT}</p>
  </section></div>;
}
