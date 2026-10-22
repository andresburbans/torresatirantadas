import { format } from '@/lib/geometry';
import { guyCorners, updateGuyCornerSetup } from '@/lib/guy-corners';
import type { GuyCornerSetup, GuyId, TowerProject } from '@/lib/tower';
import { Field, Select } from './form-controls';

export function GuyCorners({project:p,id,change}:{project:TowerProject;id:GuyId;change:(fn:(p:TowerProject)=>TowerProject)=>void}){
  const data=guyCorners(p,id),{setup,pivot,distance}=data;
  const line=setup.mode==='PL'&&setup.localFrame!=='station';
  const update=(patch:Partial<GuyCornerSetup>)=>change(q=>updateGuyCornerSetup(q,id,patch));
  const frame=setup.useUtm?'Coordenadas UTM':line?`Punto–Línea · origen ${pivot}′ · N hacia T${id}-A`:`Origen T${id}-${setup.mode} (0,0) · 0° hacia ${pivot}′`;
  return <div className="mast-corners-panel" aria-label={`Vértices del prefabricado T${id}`}>
    <div className="mast-corners-header">
      <div><span className="tiny-label">PREFABRICADO T{id} · CARA 2 m × FONDO 1 m</span><strong className="mast-corners-subtitle">{frame}</strong></div>
      <label className="inherit-check mast-utm-check"><input type="checkbox" checked={setup.useUtm} onChange={e=>update({useUtm:e.target.checked})}/>Ver coordenadas UTM</label>
    </div>
    <div className="settings-grid">
      <Select id={`guy-${id}-corner-mode`} label="Modo de armado" value={setup.mode} onChange={mode=>update({mode:mode as 'A'|'PL'})}>
        <option value="A">T{id}-A · Sobre el eje</option><option value="PL">T{id}-PL · Punto–Línea SOUTH N6+</option>
      </Select>
      <Field id={`guy-${id}-offset`} label="Offset hacia afuera" value={setup.offset} onChange={offset=>update({offset})} hint="Por cada cara. Ej. 0.03 o 0.10 m; 0: borde del bloque."/>
      {setup.mode==='A'&&!setup.useUtm&&<Field id={`guy-${id}-distance-a`} label={`DH T${id}-A → ${pivot}′`} value={setup.distanceA} onChange={distanceA=>update({distanceA})} hint="Distancia horizontal medida, con el punto A sobre el eje. También sirve desde B si está alineado."/>}
      {setup.mode==='PL'&&!setup.useUtm&&<Select id={`guy-${id}-local-frame`} label="Sistema local de salida" value={setup.localFrame??'line'} onChange={localFrame=>update({localFrame:localFrame as 'line'|'station'})}>
        <option value="line">Punto–Línea · origen en P1</option><option value="station">Estación (0,0) · cero hacia P1</option>
      </Select>}
      {setup.mode==='PL'&&!line&&!setup.useUtm&&<>
        <Field id={`guy-${id}-station-n`} label="N0 · Estación, pantalla OCC" value={setup.stationAlong} onChange={stationAlong=>update({stationAlong})} hint="Coordenada longitudinal de la estación en Punto–Línea, con su signo."/>
        <Field id={`guy-${id}-station-e`} label="E0 · Estación, pantalla OCC" value={setup.stationRight} onChange={stationRight=>update({stationRight})} hint={`Positivo a la derecha mirando de ${pivot}′ hacia T${id}-A; negativo a la izquierda.`}/>
      </>}
    </div>
    <p className="setting-note">Referencia de diseño: {pivot}′ → centro de la cara cercana = C + X₁ + K = <strong>{distance===null?'—':format(distance)} m</strong>. Cara de 2 m: 1 m a cada lado del eje. Cara opuesta: 1 m más lejos. Los vértices conservan su posición aunque cambies el armado del resultado principal.</p>
    {setup.mode==='A'&&!setup.useUtm?<p className="setting-note">Local: N apunta desde A/B hacia {pivot}′; E es positivo a la derecha de esa visual. Sin offset, la cara cercana queda en N = DH medida − (C + X₁ + K); la opuesta, 1 m menos.</p>:setup.mode==='PL'?<p className="setting-note">En SOUTH N6+: Programas → Punto–Línea. Mide primero P1 = {pivot}′ y después P2 = T{id}-A. El sistema usa P1 como (0,0) y P1→P2 como norte. {setup.useUtm?'Desmarca UTM para ver la salida local correspondiente.':line?'Puedes usar directamente estas N/E en ese sistema.':'Copia N0/E0 desde OCC. Esta salida transforma los vértices a origen en la estación y cero hacia P1; no son las coordenadas del sistema Punto–Línea.'}</p>:null}
    {setup.useUtm&&<p className="setting-note">UTM usa las N/E de E′ y F′ y φ del tirante. No requiere DH de A ni N0/E0; el origen es el sistema de coordenadas de Ajustes.</p>}
    <div className="mast-table-wrap"><table className="mast-corners-table">
      <caption className="hidden">Vértices T{id}1 a T{id}4 · {frame}</caption>
      <thead><tr><th>Vértice</th><th>{setup.useUtm?'Norte UTM (m)':'Norte local (m)'}</th><th>{setup.useUtm?'Este UTM (m)':'Este local (m)'}</th></tr></thead>
      <tbody>{data.corners.length?data.corners.map(c=><tr key={c.id}><td><strong>{c.id}</strong></td><td>{format(c.n,3)}</td><td>{format(c.e,3)}</td></tr>):<tr><td colSpan={3} className="text-muted">{data.errors.join(' ')}</td></tr>}</tbody>
    </table></div>
    <details className="result-diagnostics"><summary>Ver esquema del prefabricado y armado</summary><div><GuyCornerDiagram id={id} data={data}/></div></details>
  </div>;
}

function GuyCornerDiagram({id,data}:{id:GuyId;data:ReturnType<typeof guyCorners>}){
  const {pivot,setup}=data,pl=setup.mode==='PL';
  return <svg className="survey-plan technical-svg" viewBox="0 0 440 380" role="img" aria-label={`Prefabricado T${id}: T${id}1 y T${id}2 en la cara cercana de 2 metros, T${id}3 y T${id}4 en la opuesta a 1 metro; referencia ${pivot} prima`}>
    <defs><pattern id={`guy-${id}-dots`} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="#ddd"/></pattern></defs>
    <rect width="440" height="380" fill={`url(#guy-${id}-dots)`}/>
    <path d="M220 50V330" stroke="#aaa" strokeDasharray="5 5"/>
    <rect x="150" y="120" width="140" height="70" fill="none" stroke="#444" strokeWidth="2"/>
    <path d="M220 190V330" stroke="#444"/>
    {Number(setup.offset.replace(',','.'))>0&&<rect x="142" y="112" width="156" height="86" fill="none" stroke="#777" strokeDasharray="4 4"/>}
    {[[290,190,1],[150,190,2],[150,120,3],[290,120,4]].map(([x,y,n])=><g key={n}><circle cx={x} cy={y} r="3" fill="#444"/><text x={x+(x<220?-8:8)} y={y+(y===120?-10:18)} textAnchor={x<220?'end':'start'}>T{id}{n}</text></g>)}
    <text x="220" y="105" textAnchor="middle">2 m</text><text x="306" y="160">1 m</text>
    <circle cx="220" cy="330" r="4" fill="#333"/><text x="232" y="336">{pivot}′ · P1</text>
    <circle cx="220" cy="50" r="4" fill="#333"/><text x="232" y="55">T{id}-A · P2</text>
    <text x="206" y="264" textAnchor="end" className="svg-muted">C + X₁ + K</text>
    {pl&&<><circle cx="350" cy="245" r="4" fill="#333"/><path d="M220 245H350L220 330" stroke="#888" strokeDasharray="4 4" fill="none"/><text x="350" y="231" textAnchor="middle">T{id}-PL</text><text x="282" y="260" textAnchor="middle" className="svg-muted">E0</text><text x="230" y="305" className="svg-muted">N0</text></>}
    <text x="20" y="367" className="svg-muted">Esquema sin escala · numeración fija mirando desde el pivote</text>
  </svg>;
}
