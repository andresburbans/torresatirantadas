import { ArrowUpRight, ClipboardCheck, Download } from 'lucide-react';
import { format, number } from '@/lib/geometry';
import { PHASES, PHASE_NAMES, PHASE_SHORT, angleText, logCheck, phaseGeometry, sagCheck, sagTarget, smallAngleText, unitSymbol, workTemp, type SpanProject } from '@/lib/span';
import { Field } from './form-controls';

type Props = { project: SpanProject; change: (fn: (p: SpanProject) => SpanProject) => void; configure: () => void; exportLog: () => void; notify: (text: string) => void };
const signed = (n: number, digits = 3) => `${n > 0 ? '+' : ''}${format(n, digits)}`;
const clock = (iso: string) => { const d = new Date(iso), two = (n: number) => String(n).padStart(2, '0'); return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`; };

export function SpanResults({ project: p, change, configure, exportLog, notify }: Props) {
  const id = p.selected, target = sagTarget(p, id), g = target.geometry, check = sagCheck(p, id), temp = workTemp(p), unit = p.angleUnit;
  const step = (delta: number) => change(q => { const t = number(q.temp); return { ...q, temp: String(Math.round(((Number.isFinite(t) ? t : 20) + delta) * 10) / 10) }; });
  const around = target.valid ? [-2, -1, 0, 1, 2].map(d => sagTarget(p, id, temp + d)).filter(t => t.valid) : [];
  const measured = PHASES.map(phase => ({ phase, check: sagCheck(p, phase) })).filter(row => row.check.valid);
  const spread = measured.length > 1 ? Math.max(...measured.map(m => m.check.sag)) - Math.min(...measured.map(m => m.check.sag)) : NaN;
  function save() { const next = logCheck(p); if (!next) return; change(() => next); notify(`Lectura guardada: ${PHASE_SHORT[id]} ${check.ok ? 'cumple' : 'no cumple'} (${signed(check.diff * 100, 1)} cm).`); }

  return <section className="field-results" aria-label="Resultados de templado" aria-live="polite">
    <div className="field-result-heading"><div><span className="tiny-label">VANO {p.name || 'SIN NOMBRE'} · {PHASE_NAMES[id].toUpperCase()}</span><span className="station-label">{p.mode === 'set' ? 'Flechado desde estación lateral' : 'Verificación de flecha'}</span></div>
      <div className="segmented span-mode" role="group" aria-label="Modo de trabajo"><button className={p.mode === 'set' ? 'active' : ''} aria-pressed={p.mode === 'set'} onClick={() => change(q => ({ ...q, mode: 'set' }))}>Flechar</button><button className={p.mode === 'check' ? 'active' : ''} aria-pressed={p.mode === 'check'} onClick={() => change(q => ({ ...q, mode: 'check' }))}>Verificar</button></div></div>
    <div className="station-selects span-temp">
      <div><Field id="span-temp" label="Temperatura del conductor" unit="°C" signed value={p.temp} onChange={v => change(q => ({ ...q, temp: v }))} hint={number(p.creep) ? `Cálculo a ${format(temp, 1)} °C con corrección de creep ${signed(number(p.creep), 1)} °C` : undefined} />
        <div className="depth-controls">{[-1, -.5, .5, 1].map(d => <button key={d} onClick={() => step(d)}>{d > 0 ? '+' : ''}{format(d, 1)} °C</button>)}</div></div>
      {p.mode === 'check' && <Field id="span-check" label="Cenital leído al conductor" unit={unitSymbol(unit)} value={p.phases[id].checkV} onChange={v => change(q => ({ ...q, phases: { ...q.phases, [id]: { ...q.phases[id], checkV: v } } }))} hint={g.valid ? `Con el círculo en Hz ${angleText(g.midHz, unit)}` : undefined} />}
    </div>

    {!target.valid ? <div className="span-empty"><p>{target.error}</p><button className="metric-config" onClick={configure}>Completar datos del vano<ArrowUpRight size={13} /></button></div> : p.mode === 'set' ? <>
      <div className="work-metrics span-metrics">
        <div className="work-metric work-primary"><span className="metric-label">Cenital de flechado · V</span><strong className="metric-value span-angle" data-testid="span-zenith">{angleText(target.zenith, unit)}</strong><span className="metric-formula">Hilo horizontal en el conductor, en el punto medio · {format(temp, 1)} °C</span><span className="delta-pill">1 cm de flecha = {smallAngleText(target.perCm, unit)}</span></div>
        <div className="work-metric"><span className="metric-label">Giro horizontal · Hz</span><strong className="angle-value" data-testid="span-hz">{angleText(g.midHz, unit)}</strong><span className="metric-formula">Lectura de círculo hacia el punto medio · {format(g.midDist, 2)} m desde la estación</span></div>
        <div className="work-metric"><span className="metric-label">Flecha en el vano medido</span><strong className="metric-value secondary" data-testid="span-sag">{format(target.sag)}<small>m</small></strong><span className="metric-formula">Tabla {format(target.sagTable)} m × ({format(g.span)} / {format(g.span / g.ratio)})²</span></div>
      </div>
      <div className="scale-summary"><span>Tensión horizontal</span><strong>{Number.isFinite(target.tension) ? `${format(target.tension, 0)} kg${Number.isFinite(target.uts) ? ` · ${format(target.uts * 100, 1)} % de rotura` : ''}` : 'Ingresa el peso del cable'}</strong></div>
      <table className="mast-corners-table span-table"><thead><tr><th>T °C</th><th>Flecha m</th><th>Cenital</th></tr></thead><tbody>{around.map(t => <tr key={t.temp} className={t.temp === temp ? 'current-row' : ''}><td>{format(t.temp, 1)}</td><td>{format(t.sag)}</td><td>{angleText(t.zenith, unit)}</td></tr>)}</tbody></table>
    </> : !check.valid ? <div className="span-empty"><p>{check.error}</p><p>Objetivo a {format(temp, 1)} °C: flecha {format(target.sag)} m · cenital {angleText(target.zenith, unit)}.</p></div> : <>
      <div className="work-metrics span-metrics">
        <div className="work-metric work-primary"><span className="metric-label">Flecha real</span><strong className="metric-value" data-testid="span-real">{format(check.sag)}<small>m</small></strong><span className="metric-formula">Objetivo {format(target.sag)} m a {format(temp, 1)} °C</span><span className={`delta-pill span-verdict ${check.ok ? 'ok' : 'bad'}`} data-testid="span-verdict">{check.ok ? 'Cumple' : 'No cumple'} · tolerancia ±{format(check.tolerance * 100, 1)} cm</span></div>
        <div className="work-metric"><span className="metric-label">Diferencia con el objetivo</span><strong className="angle-value">{signed(check.diff * 100, 1)} cm</strong><span className="metric-formula">{signed(check.pct, 2)} % · {Math.abs(check.diff) < .0005 ? 'en flecha' : check.diff > 0 ? 'conductor bajo: falta tensar' : 'conductor alto: sobra tensión'}</span></div>
        <div className="work-metric"><span className="metric-label">Temperatura equivalente</span><strong className="angle-value">{check.tempEq === null ? 'Fuera de tabla' : `${format(check.tempEq, 1)} °C`}</strong><span className="metric-formula">{Number.isFinite(check.tension) ? `Tensión real ${format(check.tension, 0)} kg · objetivo ${format(target.tension, 0)} kg` : 'Temperatura de tabla con esta flecha'}</span></div>
      </div>
      <div className="span-save"><button className="button primary" data-testid="span-save" onClick={save}><ClipboardCheck size={16} />Guardar lectura</button><span>Queda en el registro del vano con fecha, hora y temperatura.</span></div>
      {measured.length > 1 && <><div className="scale-summary"><span>Diferencia máxima entre conductores</span><strong>{format(spread * 100, 1)} cm</strong></div>
        <table className="mast-corners-table span-table"><thead><tr><th>Conductor</th><th>Flecha m</th><th>Dif. cm</th><th></th></tr></thead><tbody>{measured.map(m => <tr key={m.phase}><td>{PHASE_SHORT[m.phase]}</td><td>{format(m.check.sag)}</td><td>{signed(m.check.diff * 100, 1)}</td><td>{m.check.ok ? 'Cumple' : 'No cumple'}</td></tr>)}</tbody></table></>}
    </>}

    {p.mode === 'check' && p.log.length > 0 && <details className="span-log" open>
      <summary>Registro del vano · {p.log.length} {p.log.length === 1 ? 'lectura' : 'lecturas'}</summary>
      <table className="mast-corners-table span-table"><thead><tr><th>Hora</th><th>Cond.</th><th>T °C</th><th>Dif. cm</th><th></th></tr></thead><tbody>{p.log.slice(0, 12).map(e => <tr key={e.at + e.phase}><td>{clock(e.at)}</td><td>{PHASE_SHORT[e.phase]}</td><td>{format(e.temp, 1)}</td><td>{signed(e.diff * 100, 1)}</td><td className={e.ok ? 'log-ok' : 'log-bad'} title={`Flecha ${format(e.sag)} m`}>{e.ok ? 'OK' : 'NO'}</td></tr>)}</tbody></table>
      <div className="span-log-actions"><button className="button light" onClick={exportLog}><Download size={15} />Exportar registro CSV</button>{p.log.length > 12 && <span>Se muestran las 12 más recientes; el CSV las incluye todas.</span>}</div>
    </details>}

    {g.valid && <><div className="scale-summary"><span>Vano medido · proyecto</span><strong>{format(g.span)} · {format(number(p.spanDesign))} m</strong></div>
      <div className="scale-summary"><span>Desnivel medido · proyecto</span><strong>{format(Math.abs(g.drop), 2)} · {format(Math.abs(number(p.dropDesign)), 2)} m</strong></div>
      {g.warnings.map(w => <p className="span-warning" role="alert" key={w}>{w}</p>)}</>}
  </section>;
}

export function phaseOptions(p: SpanProject) {
  return PHASES.map(id => ({ id, label: `${PHASE_NAMES[id]}${phaseGeometry(p, id).valid ? '' : ' · sin lecturas'}` }));
}
