import { Plus, Trash2 } from 'lucide-react';
import { format } from '@/lib/geometry';
import { PHASES, PHASE_NAMES, phaseGeometry, sagTable, unitSymbol, type AngleUnit, type DistanceKind, type PhaseId, type Shot, type SpanProject } from '@/lib/span';
import { Field, Select } from './form-controls';

export type SpanSettingsTab = 'shots' | 'design';
type Props = { project: SpanProject; change: (fn: (p: SpanProject) => SpanProject) => void; tab: SpanSettingsTab };

export function SpanSettings({ project: p, change, tab }: Props) {
  const set = <K extends keyof SpanProject>(key: K, value: SpanProject[K]) => change(q => ({ ...q, [key]: value }));
  const shot = (id: PhaseId, side: 'left' | 'right', key: keyof Shot, value: string) => change(q => ({ ...q, phases: { ...q.phases, [id]: { ...q.phases[id], [side]: { ...q.phases[id][side], [key]: value } } } }));
  const row = (index: number, key: 't' | 'sag', value: string) => change(q => ({ ...q, table: q.table.map((r, i) => i === index ? { ...r, [key]: value } : r) }));
  const angle = unitSymbol(p.angleUnit), distance = p.distanceKind === 'slope' ? 'Dist. inclinada' : 'Dist. reducida', table = sagTable(p);

  if (tab === 'shots') return <div id="span-shots-panel" role="tabpanel" aria-labelledby="span-shots-tab">
    <p className="settings-intro">Desde una sola estación al costado del vano, mide el punto de amarre del conductor en cada cruceta. El cenital es 90° (100 gon) en el horizonte. La altura instrumental no hace falta: todo se refiere al eje del instrumento.</p>
    <section className="settings-section"><div className="settings-grid">
      <Select id="span-unit" label="Unidad angular" value={p.angleUnit} onChange={v => set('angleUnit', v as AngleUnit)}><option value="gon">Gon</option><option value="dms">GGG.MMSS</option><option value="deg">Grados decimales</option></Select>
      <Select id="span-distance" label="Distancia anotada" value={p.distanceKind} onChange={v => set('distanceKind', v as DistanceKind)}><option value="horizontal">Reducida</option><option value="slope">Inclinada</option></Select>
    </div></section>
    {PHASES.map(id => { const g = phaseGeometry(p, id); return <section className="settings-section settings-point" key={id}>
      <div className="settings-grid"><h3>{PHASE_NAMES[id]}<span className="span-phase-state">{g.valid ? `Vano ${format(g.span)} m · desnivel ${format(Math.abs(g.drop), 2)} m` : 'Sin lecturas'}</span></h3>
        <Field id={`${id}-ld`} label={`Izquierda · ${distance}`} value={p.phases[id].left.dist} onChange={v => shot(id, 'left', 'dist', v)} />
        <Field id={`${id}-lv`} label="Izquierda · Cenital" unit={angle} value={p.phases[id].left.v} onChange={v => shot(id, 'left', 'v', v)} />
        <Field id={`${id}-lh`} label="Izquierda · Horizontal" unit={angle} value={p.phases[id].left.hz} onChange={v => shot(id, 'left', 'hz', v)} />
        <Field id={`${id}-rd`} label={`Derecha · ${distance}`} value={p.phases[id].right.dist} onChange={v => shot(id, 'right', 'dist', v)} />
        <Field id={`${id}-rv`} label="Derecha · Cenital" unit={angle} value={p.phases[id].right.v} onChange={v => shot(id, 'right', 'v', v)} />
        <Field id={`${id}-rh`} label="Derecha · Horizontal" unit={angle} value={p.phases[id].right.hz} onChange={v => shot(id, 'right', 'hz', v)} />
      </div></section>; })}
    <section className="settings-section settings-point"><div className="settings-grid"><h3>Corrección del punto de amarre</h3>
      <Field id="span-off-l" label="Torre izquierda · Δ vertical" value={p.offsetLeft} onChange={v => set('offsetLeft', v)} />
      <Field id="span-off-r" label="Torre derecha · Δ vertical" value={p.offsetRight} onChange={v => set('offsetRight', v)} />
    </div><p className="setting-note">Úsala cuando el punto visado no es donde apoya el conductor: mancal o basculante en anclaje, conductor en polea bajo la cadena. Positivo sube el apoyo respecto del punto medido; 0 si se visó la grapa.</p></section>
  </div>;

  return <div id="span-design-panel" role="tabpanel" aria-labelledby="span-design-tab">
    <p className="settings-intro">Datos de la tabla de templado del vano de control. La flecha de tabla se corrige al vano realmente medido entre crucetas.</p>
    <section className="settings-section"><div className="settings-grid">
      <Field id="span-name" label="Vano de control" unit="" value={p.name} onChange={v => set('name', v)} />
      <Field id="span-design" label="Vano de proyecto" value={p.spanDesign} onChange={v => set('spanDesign', v)} />
      <Field id="span-drop" label="Desnivel de tabla" value={p.dropDesign} onChange={v => set('dropDesign', v)} hint="Solo para contrastar las lecturas" />
      <Field id="span-weight" label="Peso del conductor" unit="kg/m" value={p.weight} onChange={v => set('weight', v)} />
      <Field id="span-breaking" label="Tensión de rotura" unit="kg" value={p.breaking} onChange={v => set('breaking', v)} hint="Opcional · para % de rotura" />
      <Field id="span-creep" label="Corrección por creep" unit="°C" value={p.creep} onChange={v => set('creep', v)} hint="Se suma a la temperatura medida" />
      <Field id="span-tol-pct" label="Tolerancia de flecha" unit="%" value={p.tolPct} onChange={v => set('tolPct', v)} />
      <Field id="span-tol-max" label="Tolerancia máxima" value={p.tolMax} onChange={v => set('tolMax', v)} hint="Se aplica la menor de las dos" />
    </div></section>
    <section className="settings-section settings-point"><div className="settings-grid"><h3>Tabla de templado · flecha por temperatura</h3></div>
      <div className="span-sag-rows">{p.table.map((r, i) => <div className="span-sag-row" key={i}>
        <Field id={`sag-t-${i}`} label={i ? '' : 'Temperatura'} unit="°C" value={r.t} onChange={v => row(i, 't', v)} />
        <Field id={`sag-f-${i}`} label={i ? '' : 'Flecha'} value={r.sag} onChange={v => row(i, 'sag', v)} />
        <button className="icon-button" aria-label={`Quitar fila ${i + 1}`} disabled={p.table.length <= 2} onClick={() => change(q => ({ ...q, table: q.table.filter((_, j) => j !== i) }))}><Trash2 size={16} /></button>
      </div>)}</div>
      <button className="button light" disabled={p.table.length >= 40} onClick={() => change(q => ({ ...q, table: [...q.table, { t: '', sag: '' }] }))}><Plus size={15} />Agregar temperatura</button>
      <p className="setting-note" role={table.valid ? undefined : 'alert'}>{table.valid ? `Entre ${format(table.rows[0].t, 0)} y ${format(table.rows[table.rows.length - 1].t, 0)} °C se interpola linealmente entre filas. Fuera de ese rango no se calcula.` : table.error}</p>
    </section>
  </div>;
}
