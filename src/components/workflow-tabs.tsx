export type Workflow='stakeout'|'level';
const items=[['stakeout','Replanteo'],['level','Nivelación']] as const;
export function WorkflowTabs({value,onChange,prefix}:{value:Workflow;onChange:(tab:Workflow)=>void;prefix:string}){
  return <div className="segmented workflow-tabs" role="tablist" aria-label={prefix==='settings'?'Secciones de ajustes':'Pantallas de trabajo'}>{items.map(([id,label],index)=><button type="button" role="tab" id={`${prefix}-${id}-tab`} aria-controls={`${prefix}-${id}-panel`} aria-selected={value===id} tabIndex={value===id?0:-1} className={value===id?'active':''} key={id} onClick={()=>onChange(id)} onKeyDown={event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?1:1-index;
    onChange(items[next][0]);document.getElementById(`${prefix}-${items[next][0]}-tab`)?.focus();
  }}>{label}</button>)}</div>;
}
