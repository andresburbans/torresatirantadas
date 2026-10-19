import type { ReactNode } from 'react';
import type { DMS } from '@/lib/geometry';

export function Field({label,value,onChange,unit='m',hint,id,readOnly=false}:{label:string;value:string;onChange:(v:string)=>void;unit?:string;hint?:string;id:string;readOnly?:boolean}){
  return <label className="field" htmlFor={id}><span className="field-label">{label}</span><span className="input-wrap"><input id={id} type="text" inputMode="decimal" autoComplete="off" value={value} readOnly={readOnly} onChange={e=>onChange(e.target.value)}/><span>{unit}</span></span>{hint&&<span className="field-hint">{hint}</span>}</label>;
}
export function Angle({label,value,onChange,prefix}:{label:string;value:DMS;onChange:(v:DMS)=>void;prefix:string}){
  return <fieldset className="angle-field"><legend className="field-label">{label}</legend><div className="dms-grid">{(['deg','min','sec'] as const).map((key,i)=><label className="input-wrap" key={key}><input aria-label={`${prefix} ${['grados','minutos','segundos'][i]}`} inputMode="decimal" autoComplete="off" value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value})}/><span>{['°','′','″'][i]}</span></label>)}</div></fieldset>;
}
export function Select({label,value,onChange,children,id}:{label:string;value:string;onChange:(v:string)=>void;children:ReactNode;id:string}){
  return <label className="field" htmlFor={id}><span className="field-label">{label}</span><select id={id} className="field-select" value={value} onChange={e=>onChange(e.target.value)}>{children}</select></label>;
}
