import { Copy, Plus, Trash2 } from 'lucide-react';
import { format } from '@/lib/geometry';
import { PHASES, PHASE_NAMES, convertAngles, phaseGeometry, sagTable, tableSpanOf, unitSymbol, type AngleUnit, type DistanceKind, type PhaseData, type PhaseId, type SagRow, type Shot, type SpanProject } from '@/lib/span';
import { Field, Select } from './form-controls';

export type SpanSettingsTab = 'shots' | 'design';
type Change = (fn: (p: SpanProject) => SpanProject) => void;
type Props = { project: SpanProject; change: Change; tab: SpanSettingsTab };

/** Tabla flecha–temperatura editable (conductores o cable de guarda). */
function SagRows({ prefix, rows, onChange, label }: { prefix: string; rows: SagRow[]; onChange: (rows: SagRow[]) => void; label: string }) {
  const table = sagTable({ table: rows }, label);
  return <>
    <div className="span-sag-rows">{rows.map((r, i) => <div className="span-sag-row" key={i}>
      <Field id={`${prefix}-t-${i}`} label={i ? '' : 'Temperatura'} unit="°C" signed value={r.t} onChange={v => onChange(rows.map((x, j) => j === i ? { ...x, t: v } : x))} />
      <Field id={`${prefix}-f-${i}`} label={i ? '' : 'Flecha'} value={r.sag} onChange={v => onChange(rows.map((x, j) => j === i ? { ...x, sag: v } : x))} />
      <button className="icon-button" aria-label={`Quitar fila ${i + 1}`} disabled={rows.length <= 2} onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
    </div>)}</div>
    <button className="button light" disabled={rows.length >= 40} onClick={() => onChange([...rows, { t: '', sag: '' }])}><Plus size={15} />Agregar temperatura</button>
    <p className="setting-note" role={table.valid ? undefined : 'alert'}>{table.valid ? `Entre ${format(table.rows[0].t, 0)} y ${format(table.rows[table.rows.length - 1].t, 0)} °C se interpola linealmente entre filas. Fuera de ese rango no se calcula.` : table.error}</p>
  </>;
}

export function SpanSettings({ project: p, change, tab }: Props) {
  const set = <K extends keyof SpanProject>(key: K, value: SpanProject[K]) => change(q => ({ ...q, [key]: value }));
  const phase = (id: PhaseId, patch: Partial<PhaseData>) => change(q => ({ ...q, phases: { ...q.phases, [id]: { ...q.phases[id], ...patch } } }));
  const shot = (id: PhaseId, side: 'left' | 'right', key: keyof Shot, value: string) => change(q => ({ ...q, phases: { ...q.phases, [id]: { ...q.phases[id], [side]: { ...q.phases[id][side], [key]: value } } } }));
  const angle = unitSymbol(p.angleUnit), distance = p.distanceKind === 'slope' ? 'Dist. inclinada' : 'Dist. reducida';

  if (tab === 'shots') return <div id="span-shots-panel" role="tabpanel" aria-labelledby="span-shots-tab">
    <p className="settings-intro">Desde una sola estación al costado del vano, mide el punto de amarre del conductor en cada cruceta. El cenital es 90° (100 gon) en el horizonte; anota las lecturas en círculo I. La altura instrumental no hace falta: todo se refiere al eje del instrumento.</p>
    <section className="settings-section"><div className="settings-grid">
      <Select id="span-unit" label="Unidad angular" value={p.angleUnit} onChange={v => change(q => convertAngles(q, v as AngleUnit))}><option value="gon">Gon</option><option value="dms">GGG.MMSS</option><option value="deg">Grados decimales</option></Select>
      <Select id="span-distance" label="Distancia anotada" value={p.distanceKind} onChange={v => set('distanceKind', v as DistanceKind)}><option value="horizontal">Reducida</option><option value="slope">Inclinada</option></Select>
    </div><p className="setting-note">Al cambiar la unidad, las lecturas ya anotadas se convierten. Cambiar el tipo de distancia no las convierte: elige el que muestra el instrumento.</p></section>
    {PHASES.map(id => {
      const g = phaseGeometry(p, id), d = p.phases[id];
      return <details className="settings-section span-phase" key={id} open={id === p.selected}>
        <summary><span>{PHASE_NAMES[id]}</span><span className={`span-phase-state ${g.valid ? 'ok' : ''}`}>{g.valid ? `Vano ${format(g.span)} m · desnivel ${format(Math.abs(g.drop), 2)} m` : d.left.dist || d.right.dist ? 'Lecturas incompletas' : 'Sin lecturas'}</span></summary>
        <div className="settings-grid">
          <Field id={`${id}-ld`} label={`Izquierda · ${distance}`} value={d.left.dist} onChange={v => shot(id, 'left', 'dist', v)} />
          <Field id={`${id}-lv`} label="Izquierda · Cenital" unit={angle} value={d.left.v} onChange={v => shot(id, 'left', 'v', v)} />
          <Field id={`${id}-lh`} label="Izquierda · Horizontal" unit={angle} value={d.left.hz} onChange={v => shot(id, 'left', 'hz', v)} />
          <Field id={`${id}-rd`} label={`Derecha · ${distance}`} value={d.right.dist} onChange={v => shot(id, 'right', 'dist', v)} />
          <Field id={`${id}-rv`} label="Derecha · Cenital" unit={angle} value={d.right.v} onChange={v => shot(id, 'right', 'v', v)} />
          <Field id={`${id}-rh`} label="Derecha · Horizontal" unit={angle} value={d.right.hz} onChange={v => shot(id, 'right', 'hz', v)} />
          <Field id={`${id}-ol`} label="Izquierda · Δ vertical al apoyo" signed value={d.offLeft} onChange={v => phase(id, { offLeft: v })} />
          <Field id={`${id}-or`} label="Derecha · Δ vertical al apoyo" signed value={d.offRight} onChange={v => phase(id, { offRight: v })} />
        </div>
        {!g.valid && (d.left.dist || d.right.dist) ? <p className="setting-note" role="alert">{g.errors[0]}</p> : null}
        {id !== 'gw' && <button className="text-button span-copy" onClick={() => change(q => ({ ...q, phases: Object.fromEntries(PHASES.map(k => [k, k === 'gw' ? q.phases.gw : { ...q.phases[k], offLeft: q.phases[id].offLeft, offRight: q.phases[id].offRight }])) as Record<PhaseId, PhaseData> }))}><Copy size={13} />Usar este Δ vertical en las tres fases</button>}
      </details>;
    })}
    <p className="setting-note">Δ vertical: úsalo cuando el punto visado no es donde apoya el conductor (grapa bajo la cadena de suspensión, polea, mancal o basculante). Negativo baja el apoyo respecto del punto medido; 0 si se visó la grapa. El cable de guarda suele ir sin cadena.</p>
  </div>;

  const ruling = tableSpanOf(p);
  return <div id="span-design-panel" role="tabpanel" aria-labelledby="span-design-tab">
    <p className="settings-intro">Datos de la tabla de templado. La flecha de tabla se corrige al vano realmente medido entre crucetas: f = f<sub>tabla</sub> × (vano medido / vano de la tabla)².</p>
    <section className="settings-section"><div className="settings-grid">
      <Field id="span-name" label="Vano de control" unit="" value={p.name} onChange={v => set('name', v)} />
      <Field id="span-design" label="Vano de proyecto" value={p.spanDesign} onChange={v => set('spanDesign', v)} hint="Para contrastar el vano medido" />
      <Field id="span-ruling" label="Vano de la tabla" value={p.tableSpan} onChange={v => set('tableSpan', v)} hint={p.tableSpan.trim() ? 'Regulador del cantón' : Number.isFinite(ruling) ? `Vacío: se usa el de proyecto (${format(ruling)} m)` : 'Vacío: se usa el de proyecto'} />
      <Field id="span-drop" label="Desnivel de proyecto" value={p.dropDesign} onChange={v => set('dropDesign', v)} hint="Solo para contrastar las lecturas" />
      <Field id="span-creep" label="Corrección por creep" unit="°C" signed value={p.creep} onChange={v => set('creep', v)} hint="Se suma a la temperatura medida; habitualmente negativa" />
      <Field id="span-tol-pct" label="Tolerancia de flecha" unit="%" value={p.tolPct} onChange={v => set('tolPct', v)} />
      <Field id="span-tol-max" label="Tolerancia máxima" value={p.tolMax} onChange={v => set('tolMax', v)} hint="Se aplica la menor de las dos" />
    </div></section>
    <section className="settings-section settings-point"><div className="settings-grid"><h3>Conductor de fase</h3>
      <Field id="span-weight" label="Peso del conductor" unit="kg/m" value={p.weight} onChange={v => set('weight', v)} />
      <Field id="span-breaking" label="Tensión de rotura" unit="kg" value={p.breaking} onChange={v => set('breaking', v)} hint="Opcional · para % de rotura" />
    </div>
      <h3 className="span-subhead">Tabla de templado · flecha por temperatura</h3>
      <SagRows prefix="sag" rows={p.table} label="la tabla de templado" onChange={rows => set('table', rows)} />
    </section>
    <details className="settings-section span-phase" open={p.selected === 'gw'}>
      <summary><span>Cable de guarda · OPGW</span><span className={`span-phase-state ${sagTable(p.gw).valid ? 'ok' : ''}`}>{sagTable(p.gw).valid ? 'Tabla propia' : 'Sin tabla'}</span></summary>
      <p className="setting-note">El cable de guarda tiene otro peso y otra tabla de flechas. Sin tabla propia no se calcula su flechado.</p>
      <div className="settings-grid">
        <Field id="gw-weight" label="Peso del cable" unit="kg/m" value={p.gw.weight} onChange={v => set('gw', { ...p.gw, weight: v })} />
        <Field id="gw-breaking" label="Tensión de rotura" unit="kg" value={p.gw.breaking} onChange={v => set('gw', { ...p.gw, breaking: v })} hint="Opcional" />
      </div>
      <SagRows prefix="gw-sag" rows={p.gw.table} label="la tabla del cable de guarda" onChange={table => change(q => ({ ...q, gw: { ...q.gw, table } }))} />
    </details>
  </div>;
}
