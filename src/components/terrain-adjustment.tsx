'use client';
/**
 * Ajuste de terreno (retirado de la interfaz en v2.3.0).
 * Se conserva sin montar por si vuelve a necesitarse. Para reactivarlo:
 * 1. TERRAIN_ADJUSTMENT_ENABLED = true en src/lib/tower.ts.
 * 2. Renderizar <TerrainAdjustment/> en src/app/page.tsx bajo los resultados de Replanteo,
 *    con el botón «Mostrar ajuste de terreno» que alterna p.terrainVisible.
 */
import { ArrowUpRight } from 'lucide-react';
import type { Soil } from '@/lib/catalog';
import { angleLabel, format, number, type Inputs } from '@/lib/geometry';
import { inputFor, phiFor, selectSoil, setGuyMode, setPhi, type GuyData, type GuyId, type TowerProject } from '@/lib/tower';
import { Angle, Field, Select } from './form-controls';

type Props={project:TowerProject;setP:(fn:(p:TowerProject)=>TowerProject)=>void;guy:GuyId;setTable:(open:boolean)=>void};
export function TerrainAdjustment({project:p,setP,guy,setTable}:Props){
  const g=p.guys[guy],input=inputFor(p,guy);
  function editGuy<K extends keyof GuyData>(key:K,value:GuyData[K]){setP(q=>({...q,guys:{...q.guys,[guy]:{...q.guys[guy],[key]:value}}}));}
  function changeMode(mode:Inputs['mode']){setP(q=>setGuyMode(q,guy,mode));}
  return <>
        <section className="point-data" id="ajuste-terreno"><div className="point-section-heading"><h2>Ajuste en terreno · T{guy}</h2><span>S{g.soil} · β {angleLabel(p.beta)}</span></div><div className="adjust-mode"><div className="segmented"><button className={g.mode==='depth'?'active':''} onClick={()=>changeMode('depth')}>Profundidad → X</button><button className={g.mode==='x'?'active':''} onClick={()=>changeMode('x')}>X → Profundidad</button><button className={g.mode==='seal'?'active':''} onClick={()=>changeMode('seal')}>Cota de sello</button></div></div><Field id="target" label={g.mode==='depth'?'H₁ · Nueva profundidad de excavación':g.mode==='x'?'X₁ · Nueva proyección al borde':'Zs₁ · Nueva cota de sello'} value={g.target} onChange={v=>editGuy('target',v)}/><div className="depth-controls">{[-.5,-.1,.1,.5].map(step=><button key={step} onClick={()=>editGuy('target',String(Math.round((number(g.target)+step)*1000)/1000))}>{step>0?'+':''}{format(step,1)} m</button>)}</div><div className="point-grid"><Select id="datum" label="Referencia de profundidad" value={g.datum} onChange={v=>editGuy('datum',v as Inputs['datum'])}><option value="terrain">Terreno local · borde de viga</option><option value="fixed">Cota fija · datum constante</option></Select><Field id="alpha" label="α · Pendiente local del terreno" unit="°" value={g.alpha} onChange={v=>editGuy('alpha',v)}/></div><p className="point-note">{g.datum==='terrain'?'H parte del terreno local del borde. α positivo: sube desde el anclaje hacia la torre.':'H parte de la misma cota horizontal fija. α no interviene en el incremento de profundidad.'} El sello efectivo se calcula desde el sello de diseño y el traslado vertical de la misma viga.</p></section>
        <section className="point-data"><div className="point-section-heading"><h2>Datos de proyecto · T{guy}</h2><button className="text-button" onClick={()=>setTable(true)}>Ver tabla<ArrowUpRight size={13}/></button></div><div className="point-grid"><Field id="c" label="C · Afloramiento desde pivote" value={g.c} onChange={v=>editGuy('c',v)}/><Field id="seal-design" label="Cota de sello de diseño · Zs₀" value={g.sealDesign} onChange={v=>editGuy('sealDesign',v)}/><Field id="x0" label="X₀ · Proyección de diseño" value={g.x0} onChange={v=>editGuy('x0',v)}/><Field id="h0" label="H₀ · Profundidad de diseño" value={g.h0} onChange={v=>editGuy('h0',v)}/><Select id="point-soil" label="Referencia de suelo de este tirante" value={g.soil} onChange={v=>setP(q=>selectSoil(q,v as Soil,guy))}><option value="3">S3 · Tipo 3</option><option value="4">S4 · Tipo 4</option></Select><Angle label={`φ · Horizontal T${guy}`} prefix={`Fi activo T${guy}`} value={phiFor(p,guy)} onChange={v=>setP(q=>setPhi(q,guy,v))}/></div>{guy!=='1'&&<label className="inherit-check"><input type="checkbox" checked={g.phiLinked} onChange={e=>setP(q=>({...q,guys:{...q.guys,[guy]:{...q.guys[guy],phi:{...phiFor(q,guy)},phiLinked:e.target.checked}}}))}/>Usar φ de T1</label>}<p className="point-note">X₀/H₀ forman una referencia compatible con α y β. C, sellos, objetivos y lecturas se guardan por tirante. K = {format(number(p.k))} m y e = {format(number(p.pivot))} m son generales y se editan en Ajustes. Zt₀ de referencia: {format(number(input.groundElevation))} m, obtenido como sello de diseño + H₀.</p></section>
  </>;
}
