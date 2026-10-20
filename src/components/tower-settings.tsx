import { useState } from 'react';
import { Lock, LockOpen, Search } from 'lucide-react';
import { ALPHAS, CATALOG, type Soil, type Tower } from '@/lib/catalog';
import { angleLabel, format } from '@/lib/geometry';
import { applyPreset, GUYS, POINTS, leveling, orientation, phiFor, pivotFor, selectSoil, setPhi, type Coord, type PointId, type TowerProject } from '@/lib/tower';
import { Angle, Field, Select } from './form-controls';
import type { Workflow } from './workflow-tabs';
import { loadTowerReferences, matchingReference, referencesFor, REFERENCE_TOWERS, searchTowers, selectTowerReference } from '@/lib/tower-references';

type Props={project:TowerProject;change:(fn:(p:TowerProject)=>TowerProject)=>void;tab:Workflow};
export function TowerSettings({project:p,change,tab}:Props){
  const [editable,setEditable]=useState(false),[query,setQuery]=useState(''),[loaded,setLoaded]=useState(false);
  const matches=searchTowers(query),rows=referencesFor(p.id),unidentified=rows.filter(r=>r.ref===null);
  function coord(id:keyof TowerProject['survey']['coords'],key:keyof Coord,value:string){
    if(!editable)return;
    change(v=>({...v,survey:{...v.survey,backsight:id===v.survey.levelRef&&key==='z'&&value!==v.survey.coords[id].z?'':v.survey.backsight,coords:{...v.survey.coords,[id]:{...v.survey.coords[id],[key]:value}}}}));
  }
  function chooseTower(id:string){change(v=>loadTowerReferences(v,id));setQuery('');setEditable(false);setLoaded(true);}
  function seal(id:PointId,value:string){change(v=>id==='M1'?{...v,mast:{...v.mast,sealDesign:value}}:{...v,guys:{...v.guys,[id]:{...v.guys[id],sealDesign:value}}});}
  const hi=leveling(p,'M1').hi;
  return <div className="tower-settings">
    <details className="settings-project"><summary>Torre y referencias · {p.id||'Sin ID'}</summary><div className="settings-section">
      <div className="tower-search">
        <label className="field" htmlFor="tower-search"><span className="field-label">Buscar torre · T#</span><span className="tower-search-input"><Search size={18} aria-hidden="true"/><input id="tower-search" type="search" autoComplete="off" placeholder="Ej. 574 o T274A" value={query} onChange={e=>setQuery(e.target.value)}/></span></label>
        <p className="setting-note">Torre actual: <strong>{p.id||'Sin número'}</strong> · {REFERENCE_TOWERS.length} torres en el catálogo sin conexión. Selecciona un resultado para cargar sus referencias.</p>
        {query.trim()&&<div className="tower-search-results" aria-label="Resultados de torres">{matches.slice(0,8).map(id=><button type="button" key={id} onClick={()=>chooseTower(id)}><strong>{id}</strong><span>Cargar RF41 / RF32</span></button>)}<p role="status">{matches.length?`${matches.length} coincidencia${matches.length===1?'':'s'}${matches.length>8?' · Escribe más cifras para afinar la búsqueda.':''}`:'Sin coincidencias. Comprueba el número; puedes introducir coordenadas manualmente.'}</p></div>}
        {loaded&&<p className="settings-reference" role="status">Catálogo de {p.id} seleccionado. Revisa abajo las referencias cargadas o pendientes. Los demás datos se conservan: comprueba pivotes, sellos y diseño al cambiar de torre.</p>}
      </div>
    </div></details>
    <div id="settings-stakeout-panel" role="tabpanel" aria-labelledby="settings-stakeout-tab" hidden={tab!=='stakeout'}>
      <details open><summary>Referencia de diseño · suelo y torre</summary><div className="settings-section">
      <div className="settings-grid">
        <Select id="settings-tower" label="Familia de torre" value={p.tower} onChange={v=>change(q=>applyPreset(q,v as Tower,q.soil,q.referenceAlpha))}>{['GI6KL','G6KL','GR6KL'].map(t=><option key={t}>{t}</option>)}</Select>
        <Select id="settings-soil" label="Suelo general" value={p.soil} onChange={v=>change(q=>selectSoil(q,v as Soil))}><option value="3">S3 · Tipo 3</option><option value="4">S4 · Tipo 4</option></Select>
        <Select id="settings-alpha" label="α · Fila de referencia" value={p.referenceAlpha} onChange={v=>change(q=>applyPreset(q,q.tower,q.soil,v))}>{ALPHAS.map(a=><option key={a} value={a}>{format(a,1)}°</option>)}</Select>
        <Field id="settings-e" label="e · Mástil → cada pivote" value={p.pivot} onChange={v=>change(q=>({...q,pivot:v}))}/>
        <Field id="settings-k" label="K · Alineación lateral" value={p.k} onChange={v=>change(q=>({...q,k:v}))}/>
        <Angle label="β · Vertical común" prefix="Beta común" value={p.beta} onChange={v=>change(q=>({...q,beta:v}))}/>
      </div>
      <p className="setting-note">Elegir suelo o aplicar diseño inicia los cuatro tirantes en su profundidad y X tabuladas. Después puedes ajustar cada excavación. Cambiar familia o fila conserva los objetivos personalizados. C, sellos, K y φ se conservan.</p>
      <div className="settings-reference">{p.tower} · S{p.soil} · H₀ tabulada {format(CATALOG[p.tower][p.soil].h)} m · Revisa X₀/H₀ de cada ficha antes de replantear.</div>
      <button className="button secondary" onClick={()=>change(q=>selectSoil(q,q.soil))}>Aplicar diseño a los 4 tirantes</button>
      </div></details>
      <details><summary>Coordenadas N / E / Z</summary><div className="settings-section">
      <div className="coordinate-heading"><h3>Coordenadas N / E / Z</h3><button type="button" className="button secondary coordinate-lock" aria-pressed={editable} onClick={()=>setEditable(v=>!v)}>{editable?<LockOpen size={16}/>:<Lock size={16}/>} {editable?'Bloquear coordenadas':'Habilitar edición'}</button></div>
      <p className="setting-note">{editable?'Edición habilitada para todas las coordenadas.':'Bloqueadas: habilita la edición para escribir. La precarga desde el catálogo sigue disponible.'} Se bloquean de nuevo al abrir Ajustes.</p>
      {(['R41','R32','E','F','M1'] as const).map(id=>{
        const ref=id==='R41'||id==='R32'?id:null,options=ref?referencesFor(p.id,ref):[],source=ref?matchingReference(p.id,ref,p.survey.coords[id]):undefined;
        return <fieldset className="coordinate-fields" key={id}><legend>{id==='E'||id==='F'?`${id}′ · Pivote`:id==='M1'?'M1 · Mástil (N/E opcionales)':`${id} · Referencia`}</legend>
          {ref&&<>
            {options.length>1&&<Select id={`source-${ref}`} label="Referencia del catálogo · elige el punto materializado" value={source?.id??''} onChange={value=>{change(v=>selectTowerReference(v,ref,value));setEditable(false);}}><option value="" disabled>Seleccionar alternativa…</option>{options.map(r=><option key={r.id} value={r.id}>{r.description}{r.date?` · ${r.date}`:''}</option>)}</Select>}
            <p className={`coordinate-source${options.length!==1&&!source?' coordinate-attention':''}`}>
              {source?`Origen: ${source.description}${source.date?` · ${source.date}`:''}`:options.length>1?'Hay varias referencias identificadas. Elige una antes de usarla; las coordenadas manuales se conservan.':options.length===0?`No hay ${ref} identificada para esta torre. Completa y verifica sus coordenadas manualmente.`:'Coordenadas manuales: no coinciden con el punto del catálogo.'}
            </p>
          </>}
          <div className="settings-grid">{(['n','e','z'] as const).map(axis=><Field key={axis} id={`coord-${id}-${axis}`} label={`${axis.toUpperCase()} · ${id}`} value={p.survey.coords[id][axis]} readOnly={!editable} onChange={v=>coord(id,axis,v)}/>)}</div>
        </fieldset>;
      })}
      {unidentified.length>0&&<details className="unidentified-references"><summary>{unidentified.length} puntos sin etiqueta RF41/RF32</summary><p className="setting-note">El archivo no identifica su función. Se conservan como consulta; no se asignan automáticamente a un amarre.</p>{unidentified.map(r=><p className="coordinate-source" key={r.id}><strong>{r.description}</strong><br/>N {r.n} · E {r.e} · Z {r.z}{r.date&&<><br/>{r.date}</>}</p>)}</details>}
      <p className="setting-note">Usa un mismo sistema de coordenadas y metros, sin separadores de miles. N/E de E′ y F′ define el eje real. El catálogo contiene los amarres, no los pivotes ni los sellos. Cambiar Z de la referencia del nivel vacía su vista (+): debes observarla nuevamente.</p>
      <p className="setting-note">Si N/E de M1 quedan ambas vacías se usa el punto medio entre E′ y F′. Si el mástil no está en ese punto, ingresa sus coordenadas. Las Z de pivotes y M1 se conservan como referencia; no sustituyen las cotas de sello.</p>
      </div></details>
    <details><summary>Cuatro ángulos φ y distancias C</summary><div className="settings-section">
      <p className="setting-note">φ se mide desde el eje transversal ±X. Al editar T1 se actualizan los tirantes que aún lo heredan. Editar otro φ lo independiza; puedes volver a vincularlo marcando «Usar φ de T1».</p>
      {GUYS.map(id=><div className="settings-point" key={id}><h3>Tirante {id}</h3>{id!=='1'&&<label className="inherit-check"><input type="checkbox" checked={p.guys[id].phiLinked} onChange={e=>change(q=>({...q,guys:{...q.guys,[id]:{...q.guys[id],phi:{...phiFor(q,id)},phiLinked:e.target.checked}}}))}/>Usar φ de T1</label>}<Angle label={`φ · T${id}`} prefix={`Fi T${id}`} value={phiFor(p,id)} onChange={v=>change(q=>setPhi(q,id,v))}/><Field id={`settings-c-${id}`} label={`C · T${id} · Afloramiento`} value={p.guys[id].c} onChange={v=>change(q=>({...q,guys:{...q.guys,[id]:{...q.guys[id],c:v}}}))}/></div>)}
    </div></details>
    <details><summary>Armado, cuadrantes y cero de estación</summary><div className="settings-section">
      <div className="settings-grid">
        <Select id="orientation-mode" label="Cálculo de orientación" value={p.survey.mode} onChange={v=>change(q=>({...q,survey:{...q.survey,mode:v as 'coordinates'|'axis'}}))}><option value="coordinates">Coordenadas reales N/E</option><option value="axis">Cuadrantes · R41 norte / R32 sur</option></Select>
        <Select id="pivot-mapping" label="Pivotes de armado" value={p.survey.mapping} onChange={v=>change(q=>({...q,survey:{...q.survey,mapping:v as 'F14'|'E14'}}))}><option value="F14">T1/T4 en F′ · T2/T3 en E′</option><option value="E14">T1/T4 en E′ · T2/T3 en F′</option></Select>
        <Select id="transverse-side" label="Numeración transversal" value={p.survey.side} onChange={v=>change(q=>({...q,survey:{...q.survey,side:v as 'standard'|'mirrored'}}))}><option value="standard">T1/T2 a −X · T3/T4 a +X</option><option value="mirrored">T1/T2 a +X · T3/T4 a −X</option></Select>
        <Select id="settings-zero" label="Cero de estación (0°)" value={p.survey.zero} onChange={v=>change(q=>({...q,survey:{...q.survey,zero:v as 'R41'|'R32'}}))}><option>R41</option><option>R32</option></Select>
        <Select id="occupied-station" label="Posición de estación" value={p.survey.occupied} onChange={value=>change(q=>({...q,survey:{...q.survey,occupied:value as 'auto'|'E'|'F'}}))}><option value="auto">Seguir pivote de diseño del punto</option><option value="E">E′</option><option value="F">F′</option></Select>
        <Select id="mast-station" label="Armado para replantear M1" value={p.survey.mastStation} onChange={v=>change(q=>({...q,survey:{...q.survey,mastStation:v as 'E'|'F'}}))}><option value="E">E′</option><option value="F">F′</option></Select>
      </div>
      <p className="setting-note">Eje local +Y de F′ hacia E′; +X queda a su derecha. En la disposición confirmada, +Y apunta al sur. «Cuadrantes» usa R41 al norte (−Y) y R32 al sur (+Y) desde el pivote. Usa coordenadas si no están perfectamente alineados. La disposición confirmada usa F′ para T1/T4 y E′ para T2/T3; se conserva editable para otras fichas. Comprueba la numeración en la planta.</p>
      <div className="guide-table"><table><caption>Giro horario Hz · desde el pivote de diseño de cada tirante</caption><thead><tr><th>Punto</th><th>Armado</th><th>R41</th><th>R32</th></tr></thead><tbody>{GUYS.map(id=><tr key={id}><td>T{id}</td><td>{pivotFor(p,id)}′</td>{(['R41','R32'] as const).map(z=>{const o=orientation({...p,survey:{...p.survey,occupied:'auto',zero:z}},id);return <td key={z}>{o.angle?angleLabel(o.angle):'—'}</td>;})}</tr>)}</tbody></table></div>
    </div></details>
    </div>
    <div id="settings-level-panel" role="tabpanel" aria-labelledby="settings-level-tab" hidden={tab!=='level'}>
    <details open><summary>Nivel y cinco cotas de sello</summary><div className="settings-section"><button type="button" className="button secondary coordinate-lock" aria-pressed={editable} onClick={()=>setEditable(v=>!v)}>{editable?<LockOpen size={16}/>:<Lock size={16}/>} {editable?'Bloquear cota':'Habilitar edición de cota'}</button>
      <div className="settings-grid">
        <Select id="level-ref" label="Referencia del nivel" value={p.survey.levelRef} onChange={v=>change(q=>({...q,survey:{...q.survey,levelRef:v as 'R41'|'R32',backsight:v===q.survey.levelRef?q.survey.backsight:''}}))}><option>R41</option><option>R32</option></Select>
        <Field id="level-reference-z" label={`Z · Cota de ${p.survey.levelRef}`} value={p.survey.coords[p.survey.levelRef].z} readOnly={!editable} hint={!editable?'Bloqueada · Habilita edición de cota.':undefined} onChange={v=>coord(p.survey.levelRef,'z',v)}/>
        <Field id="backsight" label="Vista (+) · Mira a referencia" value={p.survey.backsight} onChange={v=>change(q=>({...q,survey:{...q.survey,backsight:v}}))}/>
      </div>
      <div className="settings-reference">Cota instrumental del nivel <strong data-testid="settings-hi">{hi===null?'—':format(hi)+' m'}</strong></div>
      <p className="setting-note">HI = Z de referencia + vista (+). La referencia del nivel es independiente del cero de la estación. Si cambias de referencia o mueves el nivel, toma una nueva vista (+). Cambiar la referencia vacía esa lectura para evitar reutilizar la anterior. Los sellos siguientes son de diseño: el ajuste de excavación de cada tirante calcula su sello efectivo por separado.</p>
      <div className="settings-grid">{POINTS.map(id=><Field key={id} id={`seal-${id}`} label={`Sello diseño · ${id==='M1'?'M1':`T${id}`}`} value={id==='M1'?p.mast.sealDesign:p.guys[id].sealDesign} onChange={v=>seal(id,v)}/>)}</div>
      <div className="settings-level-summary">{POINTS.map(id=>{const l=leveling(p,id);return <div key={id}><span>{id==='M1'?'M1':`T${id}`} · Mira al sello efectivo</span><strong>{l.valid&&l.staff!==null?format(l.staff)+' m':'—'}</strong></div>;})}</div>
    </div></details>
    </div>
  </div>;
}
