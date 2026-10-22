import { ArrowUpRight } from 'lucide-react';
import { angleLabel, format, number } from '@/lib/geometry';
import { excavationControl, inputFor, leveling, mastCorners, orientation, resultFor, setPointStation, setPointZero, stationFor, zeroFor, type GuyId, type PivotId, type RefId, type TowerProject } from '@/lib/tower';
import { baselineScale } from '@/lib/survey';
import { Field, Select } from './form-controls';

type Props = { project: TowerProject; change: (fn: (p: TowerProject) => TowerProject) => void; configure: () => void };
const pointName = (p: TowerProject) => (p.selected === 'MC' || p.selected === 'M1') ? 'MC · Mástil Central' : `T${p.selected} · Tirante ${p.selected}`;

export function StakeoutResults({ project: p, change, configure }: Props) {
  const mast = p.selected === 'MC' || p.selected === 'M1', guy = (mast ? '1' : p.selected) as GuyId, r = resultFor(p, guy), o = orientation(p, p.selected);
  const scale = baselineScale(p);
  const distance = mast ? o.range : o.station === o.designStation ? (r.valid ? r.distanceTotal : null) : o.range;
  const currentStation = stationFor(p, p.selected);
  const currentZero = zeroFor(p, p.selected);
  const offset = number(p.mast.offset ?? '0');
  const off = offset;
  const useUtm = Boolean(p.mast.useUtm);
  const corners = mast ? mastCorners(p, off, useUtm) : [];

  return <section className="field-results" aria-label="Resultados de replanteo" aria-live="polite">
    <div className="field-result-heading"><div><span className="tiny-label">{pointName(p)}</span><span className="station-label">Replanteo desde {currentStation}′</span></div></div>
    <div className="station-selects">
      <Select id="occupied-pivot" label="Posición de estación" value={currentStation} onChange={v => change(q => setPointStation(q, q.selected, v as PivotId))}>
        <option value="F">F′</option>
        <option value="E">E′</option>
      </Select>
      <Select id="station-zero" label="Referencia del cero · 0°" value={currentZero} onChange={v => change(q => setPointZero(q, q.selected, v as RefId))}>
        <option value="R41">R41 · Norte</option>
        <option value="R32">R32 · Sur</option>
      </Select>
    </div>
    <div className="work-metrics stakeout-metrics">
      <div className="work-metric work-primary">
        <span className="metric-label">{mast ? `Distancia desde ${currentStation}′ al centro MC` : `Distancia total desde ${currentStation}′ al borde`}</span>
        <strong className="metric-value" data-testid="result-total">{distance === null ? '—' : format(distance)}<small>m</small></strong>
        <span className="metric-formula">{mast ? 'Distancia horizontal · centro de mástil' : o.station === o.designStation ? 'C + X₁ + K' : `Distancia horizontal al borde + K · diseño desde ${o.designStation}′`}</span>
        {!mast && <span className="delta-pill">{r.valid ? (Math.abs(r.deltaX) < .0005 ? 'Sin desplazamiento' : `${r.deltaX > 0 ? '+' : ''}${format(r.deltaX)} m · ${r.deltaX > 0 ? 'se aleja' : 'se acerca'}`) : 'Completa los datos de este tirante'}</span>}
      </div>
      <div className="work-metric">
        <span className="metric-label">Giro horario de estación · Hz</span>
        <strong className="angle-value" data-testid="result-hz">{o.angle ? angleLabel(o.angle) : '—'}</strong>
        <span className="metric-formula">0° en {currentZero} · armado {currentStation}′</span>
        {o.errors.length > 0 && <button className="metric-config" onClick={configure}>Completar orientación<ArrowUpRight size={13} /></button>}
      </div>
    </div>
    {scale.valid && <div className="scale-summary"><span>Factor R41–R32</span><strong data-testid="result-scale">{format(scale.factor!, 7)}</strong></div>}

    {mast && <div className="mast-corners-panel">
      <div className="mast-corners-header">
        <div>
          <span className="tiny-label">CUATRO VÉRTICES DEL MÁSTIL CENTRAL (2.8 × 2.8 m)</span>
          <strong className="mast-corners-subtitle">{useUtm ? 'Coordenadas UTM' : `Coordenadas Locales desde ${currentStation}′ (0° a ${currentZero})`}</strong>
        </div>
        <label className="inherit-check mast-utm-check">
          <input type="checkbox" checked={useUtm} onChange={e => change(q => ({ ...q, mast: { ...q.mast, useUtm: e.target.checked } }))} />
          Ver coordenadas UTM
        </label>
      </div>
      <div className="mast-offset-row">
        <Field id="mast-offset" label="Offset adicional (m)" value={p.mast.offset ?? '0'} onChange={v => change(q => ({ ...q, mast: { ...q.mast, offset: v } }))} hint="Desplaza las estacas hacia afuera (ej. 0.05, 0.10). 0: borde de mástil" />
      </div>
      <p className="setting-note">N local apunta al cero elegido; E local es positivo a la derecha de esa visual. El offset se aplica a cada cara del perímetro.</p>
      <div className="mast-table-wrap">
        <table className="mast-corners-table">
          <thead>
            <tr>
              <th>Vértice</th>
              <th>{useUtm ? 'Norte UTM (m)' : 'Norte local (m)'}</th>
              <th>{useUtm ? 'Este UTM (m)' : 'Este local (m)'}</th>
            </tr>
          </thead>
          <tbody>
            {corners.length > 0 ? corners.map(c => <tr key={c.id}>
              <td><strong>{c.id}</strong></td>
              <td>{format(c.n, 3)} m</td>
              <td>{format(c.e, 3)} m</td>
            </tr>) : <tr>
              <td colSpan={3} className="text-muted">{!Number.isFinite(off)||1.4+off<=0?'Ingresa un offset válido mayor que −1.4 m.':useUtm?'Completa N/E de R41, R32 y MC y verifica que las referencias no coincidan.':'Completa Dist MC → cada pivote en Ajustes.'}</td>
            </tr>}
          </tbody>
        </table>
      </div>
    </div>}

    <details className="result-diagnostics"><summary>Ver referencias de replanteo</summary><div>
      {!mast && <><p>C {format(number(p.guys[guy].c))} m · X₁ <span data-testid="result-x">{r.valid ? format(r.x1) : '—'} m</span> · K {format(number(p.k))} m</p><p>H diseño / ajustada: <span data-testid="result-h">{format(number(p.guys[guy].h0))} / {r.valid ? format(r.h1) : '—'} m</span></p></>}
      <p>{o.convention}</p>
      <p>{[...o.errors, ...(mast ? [] : r.errors)].join(' ') || 'Datos completos para el replanteo.'}</p>
      {o.edge && <p>N/E del {mast ? 'mástil' : 'borde sin K'}: {format(o.edge.n)} / {format(o.edge.e)} m{mast && (!p.survey.coords.MC?.n.trim() && !p.survey.coords.M1?.n.trim()) ? ' · punto medio E′–F′' : ''}</p>}
    </div></details>
  </section>;
}

export function LevelResults({ project: p, change, configure }: Props) {
  const mast = p.selected === 'MC' || p.selected === 'M1', guy = (mast ? '1' : p.selected) as GuyId, l = leveling(p, p.selected), control = excavationControl(l.remaining, l.valid);
  const reading = mast ? p.mast.staffCurrent : p.guys[guy].staffCurrent;
  return <section className="field-results" aria-label="Resultados de nivelación" aria-live="polite">
    <div className="field-result-heading"><div><span className="tiny-label">{pointName(p)}</span><span className="station-label">Nivel referido a {p.survey.levelRef}</span></div><span className="level-backsight">Vista (+) {format(number(p.survey.backsight))} m</span></div>
    <div className="work-metrics leveling-metrics">
      <div className="work-metric work-primary"><span className="metric-label">Mira al sello · Vista (−)</span><strong className="metric-value" data-testid="result-staff">{l.staff !== null && l.staff >= 0 ? format(l.staff) : '—'}<small>m</small></strong><span className="metric-formula">Cota instrumental − cota de sello efectivo</span>{l.errors.length > 0 && <button className="metric-config" onClick={configure}>Completar nivel y sellos<ArrowUpRight size={13} /></button>}</div>
      <div className="work-metric"><span className="metric-label">Cota instrumental · HI</span><strong className="metric-value secondary seal-value" data-testid="result-hi">{l.hi === null ? '—' : format(l.hi)}<small>m</small></strong></div>
      <div className="work-metric"><span className="metric-label">Cota de sello efectivo</span><strong className="metric-value secondary seal-value" data-testid="result-seal">{l.seal === null ? '—' : format(l.seal)}<small>m</small></strong></div>
    </div>
    {l.staff !== null && l.staff < 0 && <p className="field-warning">El sello está sobre la cota instrumental. Reposiciona el nivel para leer con una mira vertical normal.</p>}
    <div className="level-check"><Field id="staff-current" label={`Vista actual (−) · ${mast ? 'MC' : `T${guy}`}`} value={reading} onChange={value => change(q => mast ? { ...q, mast: { ...q.mast, staffCurrent: value } } : { ...q, guys: { ...q.guys, [guy]: { ...q.guys[guy], staffCurrent: value } } })} hint="Terreno o fondo actual" /><div><span className="metric-label">{control.label}</span><strong className="excavation-value" data-testid="result-remaining">{control.value === null ? '—' : <>{control.sign}{format(control.value)} m{control.direction && <span role="img" aria-label={control.direction === 'down' ? 'Excavar hacia abajo' : 'Exceso: fondo por debajo del sello'}>{control.direction === 'down' ? '↓' : '↑'}</span>}</>}</strong><small>Mira al sello − vista actual</small></div></div>
    <details className="result-diagnostics"><summary>Ver referencias de nivelación</summary><div><p>{l.errors.join(' ') || 'Datos completos para la nivelación.'}</p><p>Sello de diseño: {format(number(mast ? p.mast.sealDesign : p.guys[guy].sealDesign))} m</p>{!mast && <p>Terreno de diseño: {format(number(inputFor(p, guy).groundElevation))} m · El ajuste de excavación se modifica en Replanteo.</p>}</div></details>
  </section>;
}
