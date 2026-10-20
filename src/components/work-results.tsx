import { ArrowUpRight } from 'lucide-react';
import { angleLabel, format, number } from '@/lib/geometry';
import { excavationControl, inputFor, leveling, orientation, resultFor, type GuyId, type TowerProject } from '@/lib/tower';
import { baselineScale } from '@/lib/survey';
import { Field, Select } from './form-controls';

type Props={project:TowerProject;change:(fn:(p:TowerProject)=>TowerProject)=>void;configure:()=>void};
const pointName=(p:TowerProject)=>p.selected==='M1'?'M1 · Mástil':`T${p.selected} · Tirante ${p.selected}`;
export function StakeoutResults({project:p,change,configure}:Props){
  const mast=p.selected==='M1',guy=(mast?'1':p.selected) as GuyId,r=resultFor(p,guy),o=orientation(p,p.selected);
  const scale=baselineScale(p);
  const distance=mast?o.range:o.station===o.designStation?(r.valid?r.distanceTotal:null):o.range;
  return <section className="field-results" aria-label="Resultados de replanteo" aria-live="polite">
    <div className="field-result-heading"><div><span className="tiny-label">{pointName(p)}</span><span className="station-label">Replanteo desde {o.station}′</span></div></div>
    <div className="station-selects"><Select id="occupied-pivot" label="Posición de estación" value={o.station} onChange={v=>change(q=>({...q,survey:{...q.survey,occupied:v as 'E'|'F'}}))}><option value="F">F′</option><option value="E">E′</option></Select><Select id="station-zero" label="Referencia del cero · 0°" value={p.survey.zero} onChange={v=>change(q=>({...q,survey:{...q.survey,zero:v as 'R41'|'R32'}}))}><option value="R41">R41 · Norte</option><option value="R32">R32 · Sur</option></Select></div>
    <div className="work-metrics stakeout-metrics">
      <div className="work-metric work-primary"><span className="metric-label">{mast?`Distancia desde ${o.station}′ al mástil`:`Distancia total desde ${o.station}′ al borde`}</span><strong className="metric-value" data-testid="result-total">{distance===null?'—':format(distance)}<small>m</small></strong><span className="metric-formula">{mast?'Distancia horizontal · sin K':o.station===o.designStation?'C + X₁ + K':`Distancia horizontal al borde + K · diseño desde ${o.designStation}′`}</span>{!mast&&<span className="delta-pill">{r.valid?(Math.abs(r.deltaX)<.0005?'Sin desplazamiento':`${r.deltaX>0?'+':''}${format(r.deltaX)} m · ${r.deltaX>0?'se aleja':'se acerca'}`):'Completa los datos de este tirante'}</span>}</div>
      <div className="work-metric"><span className="metric-label">Giro horario de estación · Hz</span><strong className="angle-value" data-testid="result-hz">{o.angle?angleLabel(o.angle):'—'}</strong><span className="metric-formula">0° en {p.survey.zero} · armado {o.station}′</span>{o.errors.length>0&&<button className="metric-config" onClick={configure}>Completar orientación<ArrowUpRight size={13}/></button>}</div>
    </div>
    {scale.valid&&<div className="scale-summary"><span>Factor R41–R32 · medida / teórica</span><strong data-testid="result-scale">{format(scale.factor!,9)}</strong></div>}
    <details className="result-diagnostics"><summary>Ver referencias de replanteo</summary><div>{!mast&&<><p>C {format(number(p.guys[guy].c))} m · X₁ <span data-testid="result-x">{r.valid?format(r.x1):'—'} m</span> · K {format(number(p.k))} m</p><p>H diseño / ajustada: <span data-testid="result-h">{format(number(p.guys[guy].h0))} / {r.valid?format(r.h1):'—'} m</span></p></>}<p>{o.convention}</p><p>{[...o.errors,...(mast?[]:r.errors)].join(' ')||'Datos completos para el replanteo.'}</p>{o.edge&&<p>N/E del {mast?'mástil':'borde sin K'}: {format(o.edge.n)} / {format(o.edge.e)} m{mast&&p.survey.coords.M1.n.trim()===''?' · punto medio E′–F′':''}</p>}</div></details>
  </section>;
}
export function LevelResults({project:p,change,configure}:Props){
  const mast=p.selected==='M1',guy=(mast?'1':p.selected) as GuyId,l=leveling(p,p.selected),control=excavationControl(l.remaining,l.valid);
  const reading=mast?p.mast.staffCurrent:p.guys[guy].staffCurrent;
  return <section className="field-results" aria-label="Resultados de nivelación" aria-live="polite">
    <div className="field-result-heading"><div><span className="tiny-label">{pointName(p)}</span><span className="station-label">Nivel referido a {p.survey.levelRef}</span></div><span className="level-backsight">Vista (+) {format(number(p.survey.backsight))} m</span></div>
    <div className="work-metrics leveling-metrics">
      <div className="work-metric work-primary"><span className="metric-label">Mira al sello · Vista (−)</span><strong className="metric-value" data-testid="result-staff">{l.staff!==null&&l.staff>=0?format(l.staff):'—'}<small>m</small></strong><span className="metric-formula">Cota instrumental − cota de sello efectivo</span>{l.errors.length>0&&<button className="metric-config" onClick={configure}>Completar nivel y sellos<ArrowUpRight size={13}/></button>}</div>
      <div className="work-metric"><span className="metric-label">Cota instrumental · HI</span><strong className="metric-value secondary seal-value" data-testid="result-hi">{l.hi===null?'—':format(l.hi)}<small>m</small></strong></div>
      <div className="work-metric"><span className="metric-label">Cota de sello efectivo</span><strong className="metric-value secondary seal-value" data-testid="result-seal">{l.seal===null?'—':format(l.seal)}<small>m</small></strong></div>
    </div>
    {l.staff!==null&&l.staff<0&&<p className="field-warning">El sello está sobre la cota instrumental. Reposiciona el nivel para leer con una mira vertical normal.</p>}
    <div className="level-check"><Field id="staff-current" label={`Vista actual (−) · ${mast?'M1':`T${guy}`}`} value={reading} onChange={value=>change(q=>mast?{...q,mast:{...q.mast,staffCurrent:value}}:{...q,guys:{...q.guys,[guy]:{...q.guys[guy],staffCurrent:value}}})} hint="Terreno o fondo actual"/><div><span className="metric-label">{control.label}</span><strong className="excavation-value" data-testid="result-remaining">{control.value===null?'—':<>{control.sign}{format(control.value)} m{control.direction&&<span role="img" aria-label={control.direction==='down'?'Excavar hacia abajo':'Exceso: fondo por debajo del sello'}>{control.direction==='down'?'↓':'↑'}</span>}</>}</strong><small>Mira al sello − vista actual</small></div></div>
    <details className="result-diagnostics"><summary>Ver referencias de nivelación</summary><div><p>{l.errors.join(' ')||'Datos completos para la nivelación.'}</p><p>Sello de diseño: {format(number(mast?p.mast.sealDesign:p.guys[guy].sealDesign))} m</p>{!mast&&<p>Terreno de diseño: {format(number(inputFor(p,guy).groundElevation))} m · El ajuste de excavación se modifica en Replanteo.</p>}</div></details>
  </section>;
}
