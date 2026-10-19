import { ALPHAS, CATALOG, type Soil, type Tower } from '@/lib/catalog';
import { angleLabel, format } from '@/lib/geometry';
import { applyPreset, GUYS, POINTS, leveling, orientation, phiFor, setPhi, type Coord, type PointId, type TowerProject } from '@/lib/tower';
import { Angle, Field, Select } from './form-controls';

type Props={project:TowerProject;change:(fn:(p:TowerProject)=>TowerProject)=>void};
export function TowerSettings({project:p,change}:Props){
  function coord(id:keyof TowerProject['survey']['coords'],key:keyof Coord,value:string){change(v=>({...v,survey:{...v.survey,coords:{...v.survey.coords,[id]:{...v.survey.coords[id],[key]:value}}}}));}
  function seal(id:PointId,value:string){change(v=>id==='M1'?{...v,mast:{...v.mast,sealDesign:value}}:{...v,guys:{...v.guys,[id]:{...v.guys[id],sealDesign:value}}});}
  const hi=leveling(p,'M1').hi;
  return <div className="tower-settings">
    <p className="settings-intro">Constantes de esta torre y cinco fichas independientes. Se guarda al escribir; Guardar, ×, Escape y tocar fuera conservan lo ingresado, aunque falten datos.</p>
    <details open><summary>01 · Torre, suelo y referencia de diseño</summary><div className="settings-section">
      <div className="settings-grid">
        <Select id="settings-tower" label="Familia de torre" value={p.tower} onChange={v=>change(q=>applyPreset(q,v as Tower,q.soil,q.referenceAlpha))}>{['GI6KL','G6KL','GR6KL'].map(t=><option key={t}>{t}</option>)}</Select>
        <Select id="settings-soil" label="Suelo general" value={p.soil} onChange={v=>change(q=>applyPreset(q,q.tower,v as Soil,q.referenceAlpha))}><option value="3">S3 · Tipo 3</option><option value="4">S4 · Tipo 4</option></Select>
        <Select id="settings-alpha" label="α · Fila de referencia" value={p.referenceAlpha} onChange={v=>change(q=>applyPreset(q,q.tower,q.soil,v))}>{ALPHAS.map(a=><option key={a} value={a}>{format(a,1)}°</option>)}</Select>
        <Field id="settings-e" label="e · Mástil → cada pivote" value={p.pivot} onChange={v=>change(q=>({...q,pivot:v}))}/>
        <Field id="settings-k" label="K · Alineación lateral" value={p.k} onChange={v=>change(q=>({...q,k:v}))}/>
        <Angle label="β · Vertical común" prefix="Beta común" value={p.beta} onChange={v=>change(q=>({...q,beta:v}))}/>
      </div>
      <p className="setting-note">Cambiar torre, suelo o fila carga X₀/H₀ y β de la tabla en los cuatro tirantes. Los objetivos personalizados se conservan; los que seguían H₀ pasan al nuevo H₀. C, sellos, K y φ se conservan. Cada tirante puede usar después otra referencia o profundidad.</p>
      <div className="settings-reference">{p.tower} · S{p.soil} · H₀ tabulada {format(CATALOG[p.tower][p.soil].h)} m · Revisa X₀/H₀ de cada ficha antes de replantear.</div>
      <button className="button secondary" onClick={()=>change(q=>applyPreset(q,q.tower,q.soil,q.referenceAlpha))}>Aplicar referencia a los 4 tirantes</button>
    </div></details>
    <details open><summary>02 · Nivel y cinco cotas de sello</summary><div className="settings-section">
      <div className="settings-grid">
        <Select id="level-ref" label="Referencia del nivel" value={p.survey.levelRef} onChange={v=>change(q=>({...q,survey:{...q.survey,levelRef:v as 'R41'|'R32',backsight:v===q.survey.levelRef?q.survey.backsight:''}}))}><option>R41</option><option>R32</option></Select>
        <Field id="level-reference-z" label={`Z · Cota de ${p.survey.levelRef}`} value={p.survey.coords[p.survey.levelRef].z} onChange={v=>coord(p.survey.levelRef,'z',v)}/>
        <Field id="backsight" label="Vista (+) · Mira a referencia" value={p.survey.backsight} onChange={v=>change(q=>({...q,survey:{...q.survey,backsight:v}}))}/>
      </div>
      <div className="settings-reference">Cota instrumental del nivel <strong data-testid="settings-hi">{hi===null?'—':format(hi)+' m'}</strong></div>
      <p className="setting-note">HI = Z de referencia + vista (+). La referencia del nivel es independiente del cero de la estación. Si cambias de referencia o mueves el nivel, toma una nueva vista (+). Cambiar la referencia vacía esa lectura para evitar reutilizar la anterior. Los sellos siguientes son de diseño: el ajuste de excavación de cada tirante calcula su sello efectivo por separado.</p>
      <div className="settings-grid">{POINTS.map(id=><Field key={id} id={`seal-${id}`} label={`Sello diseño · ${id==='M1'?'M1':`T${id}`}`} value={id==='M1'?p.mast.sealDesign:p.guys[id].sealDesign} onChange={v=>seal(id,v)}/>)}</div>
      <div className="settings-level-summary">{POINTS.map(id=>{const l=leveling(p,id);return <div key={id}><span>{id==='M1'?'M1':`T${id}`} · Mira al sello efectivo</span><strong>{l.valid&&l.staff!==null?format(l.staff)+' m':'—'}</strong></div>;})}</div>
    </div></details>
    <details><summary>03 · Cuatro ángulos φ y distancias C</summary><div className="settings-section">
      <p className="setting-note">φ se mide desde el eje transversal ±X. Al editar T1 se actualizan los tirantes que aún lo heredan. Editar otro φ lo independiza; puedes volver a vincularlo marcando «Usar φ de T1».</p>
      {GUYS.map(id=><div className="settings-point" key={id}><h3>Tirante {id}</h3>{id!=='1'&&<label className="inherit-check"><input type="checkbox" checked={p.guys[id].phiLinked} onChange={e=>change(q=>({...q,guys:{...q.guys,[id]:{...q.guys[id],phi:{...phiFor(q,id)},phiLinked:e.target.checked}}}))}/>Usar φ de T1</label>}<Angle label={`φ · T${id}`} prefix={`Fi T${id}`} value={phiFor(p,id)} onChange={v=>change(q=>setPhi(q,id,v))}/><Field id={`settings-c-${id}`} label={`C · T${id} · Afloramiento`} value={p.guys[id].c} onChange={v=>change(q=>({...q,guys:{...q.guys,[id]:{...q.guys[id],c:v}}}))}/></div>)}
    </div></details>
    <details><summary>04 · Armado, cuadrantes y cero de estación</summary><div className="settings-section">
      <div className="settings-grid">
        <Select id="orientation-mode" label="Cálculo de orientación" value={p.survey.mode} onChange={v=>change(q=>({...q,survey:{...q.survey,mode:v as 'coordinates'|'axis'}}))}><option value="coordinates">Coordenadas reales N/E</option><option value="axis">Por eje · amarres alineados</option></Select>
        <Select id="pivot-mapping" label="Pivotes de armado" value={p.survey.mapping} onChange={v=>change(q=>({...q,survey:{...q.survey,mapping:v as 'F14'|'E14'}}))}><option value="F14">T1/T4 en F′ · T2/T3 en E′</option><option value="E14">T1/T4 en E′ · T2/T3 en F′</option></Select>
        <Select id="transverse-side" label="Numeración transversal" value={p.survey.side} onChange={v=>change(q=>({...q,survey:{...q.survey,side:v as 'standard'|'mirrored'}}))}><option value="standard">T1/T2 a −X · T3/T4 a +X</option><option value="mirrored">T1/T2 a +X · T3/T4 a −X</option></Select>
        <Select id="settings-zero" label="Cero de estación (0°)" value={p.survey.zero} onChange={v=>change(q=>({...q,survey:{...q.survey,zero:v as 'R41'|'R32'}}))}><option>R41</option><option>R32</option></Select>
        <Select id="mast-station" label="Armado para replantear M1" value={p.survey.mastStation} onChange={v=>change(q=>({...q,survey:{...q.survey,mastStation:v as 'E'|'F'}}))}><option value="E">E′</option><option value="F">F′</option></Select>
      </div>
      <p className="setting-note">Eje local +Y de F′ hacia E′; +X queda a su derecha. «Por eje» supone R41 hacia +Y y R32 hacia −Y desde el pivote. Usa coordenadas si no están perfectamente alineados. La correspondencia inicial es la del plano anterior; tus notas intercambiaban E′/F′, por eso queda editable. Comprueba la numeración en la planta.</p>
      <div className="guide-table"><table><caption>Giro horario Hz · vista 0° en cada amarre</caption><thead><tr><th>Punto</th><th>Armado</th><th>R41</th><th>R32</th></tr></thead><tbody>{GUYS.map(id=><tr key={id}><td>T{id}</td><td>{orientation(p,id).station}′</td>{(['R41','R32'] as const).map(z=>{const o=orientation({...p,survey:{...p.survey,zero:z}},id);return <td key={z}>{o.angle?angleLabel(o.angle):'—'}</td>;})}</tr>)}</tbody></table></div>
    </div></details>
    <details><summary>05 · Coordenadas N / E / Z</summary><div className="settings-section">
      <p className="setting-note">Todas las coordenadas deben usar el mismo sistema y metros, sin separadores de miles. Z de R41/R32 se usa en nivelación. N/E de ambos pivotes define el eje real. R32 es el segundo amarre; no se creó otro punto R42.</p>
      {(['R41','R32','E','F','M1'] as const).map(id=><fieldset className="coordinate-fields" key={id}><legend>{id==='E'||id==='F'?`${id}′ · Pivote`:id==='M1'?'M1 · Mástil (N/E opcionales)':`${id} · Referencia`}</legend><div className="settings-grid">{(['n','e','z'] as const).map(axis=><Field key={axis} id={`coord-${id}-${axis}`} label={`${axis.toUpperCase()} · ${id}`} value={p.survey.coords[id][axis]} onChange={v=>coord(id,axis,v)}/>)}</div></fieldset>)}
      <p className="setting-note">Si N/E de M1 quedan ambas vacías se usa el punto medio entre E′ y F′. Si el mástil no está en ese punto, ingresa sus coordenadas. Las Z de pivotes y M1 se conservan como referencia; no sustituyen las cotas de sello.</p>
    </div></details>
  </div>;
}
