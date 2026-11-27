import { useState } from 'react';
import { Lock, LockOpen, Search } from 'lucide-react';
import { ALPHAS, CATALOG, designRow, TOWERS, type Soil, type Tower } from '@/lib/catalog';
import { angleLabel, format, number } from '@/lib/geometry';
import { applyPreset, calculatePivotsFromMast, GUYS, POINTS, leveling, orientation, phiFor, phiIndividual, pivotFor, selectSoil, selectTowerFamily, setCommonX0, setPhi, setPhiIndividual, setPointStation, setPointZero, stationFor, zeroFor, type Coord, type PointId, type TowerProject } from '@/lib/tower';
import { updateSurveyCoordinate } from '@/lib/survey';
import { ScaleSettings } from './scale-settings';
import { Angle, Field, Select } from './form-controls';
import type { Workflow } from './workflow-tabs';
import { addTower, canAddTower, loadTowerReferences, matchingReference, normalizeTowerId, referencesFor, REFERENCE_TOWERS, searchAllTowers, selectTowerReference, type CustomTower } from '@/lib/tower-references';

type Props={project:TowerProject;change:(fn:(p:TowerProject)=>TowerProject)=>void;tab:Workflow;custom?:CustomTower[];setCustom?:(towers:CustomTower[])=>void};
export function TowerSettings({project:p,change,tab,custom=[],setCustom}:Props){
  const [editable,setEditable]=useState(false),[query,setQuery]=useState(''),[loaded,setLoaded]=useState<'catalog'|'added'|null>(null),[coordsOpen,setCoordsOpen]=useState(false);
  const matches=searchAllTowers(query,custom),addable=canAddTower(query,custom),rows=referencesFor(p.id),unidentified=rows.filter(r=>r.ref===null);
  const isCustom=custom.some(t=>t.tower===normalizeTowerId(p.id));
  const row=designRow(p.tower,p.soil,p.referenceAlpha),table=CATALOG[p.tower][p.soil];
  const x0Mixed=GUYS.some(id=>p.guys[id].x0!==p.guys['1'].x0),individual=phiIndividual(p);
  function coord(id:keyof TowerProject['survey']['coords'],key:keyof Coord,value:string){
    if(!editable)return;
    change(v=>updateSurveyCoordinate(v,id,key,value));
  }
  function chooseTower(id:string){change(v=>loadTowerReferences(v,id,custom));setQuery('');setEditable(false);setLoaded('catalog');}
  function addNewTower(){
    const added=addTower(p,query,custom);if(!added)return;
    setCustom?.(added.custom);change(()=>added.project);setQuery('');setEditable(true);setCoordsOpen(true);setLoaded('added');
  }
  function seal(id:PointId,value:string){change(v=>id==='MC'||id==='M1'?{...v,mast:{...v.mast,sealDesign:value}}:{...v,guys:{...v.guys,[id]:{...v.guys[id],sealDesign:value}}});}
  const hi=leveling(p,'MC').hi;
  const pivotsCalculated = calculatePivotsFromMast(p.survey.coords, number(p.pivot));

  return <div className="tower-settings">
    <details className="settings-project"><summary>Torre y referencias · {p.id||'Sin ID'}</summary><div className="settings-section">
      <div className="tower-search">
        <label className="field" htmlFor="tower-search"><span className="field-label">Buscar torre · T#</span><span className="tower-search-input"><Search size={18} aria-hidden="true"/><input id="tower-search" type="search" autoComplete="off" placeholder="Ej. 574 o T274A" value={query} onChange={e=>setQuery(e.target.value)}/></span></label>
        <p className="setting-note">Torre actual: <strong>{p.id||'Sin número'}</strong> · {REFERENCE_TOWERS.length} torres en el catálogo sin conexión{custom.length?` · ${custom.length} agregada${custom.length===1?'':'s'} en este dispositivo`:''}. Selecciona un resultado para cargar sus referencias.</p>
        {query.trim()&&<div className="tower-search-results" aria-label="Resultados de torres">{matches.slice(0,8).map(id=><button type="button" key={id} onClick={()=>chooseTower(id)}><strong>{id}</strong><span>{REFERENCE_TOWERS.includes(id)?'Cargar RF41 / RF32':'Agregada en este dispositivo'}</span></button>)}
          {addable&&<button type="button" className="tower-add" onClick={addNewTower}><strong>Agregar torre {addable}</strong><span>No está en el catálogo · R41/R32 manuales</span></button>}
          <p role="status">{matches.length?`${matches.length} coincidencia${matches.length===1?'':'s'}${matches.length>8?' · Escribe más cifras para afinar la búsqueda.':''}`:addable?`${addable} no está en el catálogo. Puedes agregarla e ingresar sus coordenadas.`:'Sin coincidencias. Escribe un número de torre, por ejemplo 499.'}</p></div>}
        {loaded==='added'&&<p className="settings-reference" role="status">Torre {p.id} agregada en este dispositivo. Ingresa N/E/Z de R41 y R32 en «Coordenadas N / E / Z»; la edición quedó habilitada. Se vaciaron C, sellos, vistas (−) y las coordenadas de E′, F′ y MC de la torre anterior.</p>}
        {loaded==='catalog'&&<p className="settings-reference" role="status">Catálogo de {p.id} seleccionado. Revisa abajo las referencias cargadas o pendientes. Al cambiar de número de torre se vacían C, sellos, vistas (−), DH a los puntos A/PL y las coordenadas de E′, F′ y MC de la torre anterior. Se conservan familia, suelo, ángulos y K.</p>}
      </div>
    </div></details>
    <div id="settings-stakeout-panel" role="tabpanel" aria-labelledby="settings-stakeout-tab" hidden={tab!=='stakeout'}>
      <details open><summary>Referencia de diseño · suelo y torre</summary><div className="settings-section">
      <div className="settings-grid design-grid">
        <Select id="settings-tower" label="Familia de torre" value={p.tower} onChange={v=>change(q=>selectTowerFamily(q,v as Tower))}>{TOWERS.map(t=><option key={t}>{t}</option>)}</Select>
        <Select id="settings-soil" label="Suelo general" value={p.soil} onChange={v=>change(q=>selectSoil(q,v as Soil))}><option value="3">S3 · Tipo 3</option><option value="4">S4 · Tipo 4</option></Select>
        <Select id="settings-alpha" label="α · Fila de referencia" value={p.referenceAlpha} onChange={v=>change(q=>applyPreset(q,q.tower,q.soil,v))}>{ALPHAS.map(a=><option key={a} value={String(a)}>{format(a,1)}°</option>)}</Select>
        <Field id="settings-x0" label="X₀ · Distancia de la fila" value={p.guys['1'].x0} onChange={v=>change(q=>setCommonX0(q,v))} hint={row?`Plano: ${format(row.x)} m`:undefined}/>
        <Field id="settings-e" label="Dist MC → cada pivote" value={p.pivot} onChange={v=>change(q=>({...q,pivot:v}))}/>
        <Field id="settings-k" label="K · Alineación lateral" value={p.k} onChange={v=>change(q=>({...q,k:v}))}/>
        <Angle label="β · Vertical común" prefix="Beta común" value={p.beta} onChange={v=>change(q=>({...q,beta:v}))}/>
      </div>
      {x0Mixed&&<p className="setting-note coordinate-attention">Los tirantes tienen X₀ distintas (T1–T4: {GUYS.map(id=>p.guys[id].x0).join(" / ")} m). Editar X₀ aquí la iguala en los cuatro.</p>}
      <p className="setting-note">Familia y suelo cargan del plano β, Dist MC, H₀ y X₀ de la fila α elegida (5° por defecto). X₀ es la distancia de esa fila al borde de viga y se aplica a los cuatro tirantes. K solo se suma a la distancia total mostrada (C + X₁ + K); no mueve los vértices ni las coordenadas. C, sellos y φ se conservan.</p>
      <div className="settings-reference">{p.tower} · S{p.soil} · α {row?format(row.alpha,1):p.referenceAlpha}° · H₀ {format(table.h)} m · X₀ {row?format(row.x):'—'} m</div>
      <details className="design-table"><summary>Ver tabla del plano · {p.tower} S{p.soil}</summary><div className="guide-table"><table><thead><tr><th>α</th><th>X₀ al borde</th><th>H₀</th></tr></thead><tbody>{ALPHAS.map((a,i)=><tr key={a} className={a===number(p.referenceAlpha)?'current-row':''}><td>{format(a,1)}°</td><td>{format(table.x[i])} m</td><td>{format(table.h)} m</td></tr>)}</tbody></table><p className="setting-note">{table.sheet} · revisión {table.revision}</p></div></details>
      <button className="button secondary" onClick={()=>change(q=>selectSoil(q,q.soil))}>Restablecer diseño en los 4 tirantes</button>
      </div></details>
    <details><summary>Cuatro ángulos y distancias</summary><div className="settings-section">
      {!individual&&<div className="settings-grid"><Angle label="Ángulo φ común · 4 tirantes" prefix="Fi común" value={p.guys['1'].phi} onChange={v=>change(q=>setPhi(q,'1',v))}/></div>}
      <label className="inherit-check phi-mode-check"><input type="checkbox" checked={individual} onChange={e=>change(q=>setPhiIndividual(q,e.target.checked))}/>Ángulo φ distinto en cada tirante</label>
      {individual?GUYS.map(id=><div className="settings-point" key={id}><h3>Tirante {id}</h3><Angle label={`φ · T${id}`} prefix={`Fi T${id}`} value={phiFor(p,id)} onChange={v=>change(q=>setPhi(q,id,v))}/><Field id={`settings-c-${id}`} label={`C · T${id} · Afloramiento`} value={p.guys[id].c} onChange={v=>change(q=>({...q,guys:{...q.guys,[id]:{...q.guys[id],c:v}}}))}/></div>)
        :<div className="settings-grid design-grid guy-c-grid">{GUYS.map(id=><Field key={id} id={`settings-c-${id}`} label={`Tirante ${id} · C`} value={p.guys[id].c} onChange={v=>change(q=>({...q,guys:{...q.guys,[id]:{...q.guys[id],c:v}}}))}/>)}</div>}
      <p className="setting-note">φ se mide desde el eje transversal ±X. Por defecto el ángulo común se usa en los cuatro tirantes; marca la casilla solo si algún tirante tiene un φ diferente. C es la distancia horizontal del pivote al afloramiento de cada tirante.</p>
    </div></details>
      <ScaleSettings project={p} change={change}/>
      <details open={coordsOpen} onToggle={e=>setCoordsOpen((e.currentTarget as HTMLDetailsElement).open)}><summary>Coordenadas N / E / Z</summary><div className="settings-section">
      <div className="coordinate-heading"><h3>Coordenadas N / E / Z</h3><button type="button" className="button secondary coordinate-lock" aria-pressed={editable} onClick={()=>setEditable(v=>!v)}>{editable?<LockOpen size={16}/>:<Lock size={16}/>} {editable?'Bloquear coordenadas':'Habilitar edición'}</button></div>
      <p className="setting-note">{editable?'Edición habilitada para todas las coordenadas.':'Bloqueadas: habilita la edición para escribir. La precarga desde el catálogo sigue disponible.'} Se bloquean de nuevo al abrir Ajustes.</p>

      {pivotsCalculated && <div className="settings-reference">
        <button type="button" className="button secondary" disabled={!editable} onClick={() => {
          change(v => ({
            ...v,
            survey: {
              ...v.survey,
              coords: {
                ...v.survey.coords,
                E: { ...v.survey.coords.E, n: pivotsCalculated.E.n, e: pivotsCalculated.E.e },
                F: { ...v.survey.coords.F, n: pivotsCalculated.F.n, e: pivotsCalculated.F.e },
              }
            }
          }));
        }}>
          Autocompletar E′ y F′ desde MC
        </button>
        <p className="setting-note">
          Calcula E′ (N {pivotsCalculated.E.n}, E {pivotsCalculated.E.e}) y F′ (N {pivotsCalculated.F.n}, E {pivotsCalculated.F.e}) a {p.pivot || '3.3'} m de MC alineados en el eje R41–R32.
        </p>
      </div>}

      {(['R41','R32','MC','E','F'] as const).map(id=>{
        const ref=id==='R41'||id==='R32'?id:null,options=ref?referencesFor(p.id,ref):[],source=ref?matchingReference(p.id,ref,p.survey.coords[id]):undefined;
        return <fieldset className="coordinate-fields" key={id}><legend>{id==='E'||id==='F'?`${id}′ · Pivote`:id==='MC'?'MC · Mástil Central (N/E opcionales)':`${id} · Referencia`}</legend>
          {ref&&<>
            {options.length>1&&<Select id={`source-${ref}`} label="Referencia del catálogo · elige el punto materializado" value={source?.id??''} onChange={value=>{change(v=>selectTowerReference(v,ref,value));setEditable(false);}}><option value="" disabled>Seleccionar alternativa…</option>{options.map(r=><option key={r.id} value={r.id}>{r.description}{r.date?` · ${r.date}`:''}</option>)}</Select>}
            <p className={`coordinate-source${options.length!==1&&!source?' coordinate-attention':''}`}>
              {source?`Origen: ${source.description}${source.date?` · ${source.date}`:''}`:options.length>1?'Hay varias referencias identificadas. Elige una antes de usarla; las coordenadas manuales se conservan.':options.length===0?(isCustom?`Torre agregada en este dispositivo: ingresa y verifica ${ref} manualmente.`:`No hay ${ref} identificada para esta torre. Completa y verifica sus coordenadas manualmente.`):'Coordenadas manuales: no coinciden con el punto del catálogo.'}
            </p>
          </>}
          <div className="settings-grid">{(['n','e','z'] as const).map(axis=><Field key={axis} id={`coord-${id}-${axis}`} label={`${axis.toUpperCase()} · ${id}`} value={p.survey.coords[id]?.[axis]??''} readOnly={!editable} onChange={v=>coord(id,axis,v)}/>)}</div>
        </fieldset>;
      })}
      {unidentified.length>0&&<details className="unidentified-references"><summary>{unidentified.length} puntos sin etiqueta RF41/RF32</summary><p className="setting-note">El archivo no identifica su función. Se conservan como consulta; no se asignan automáticamente a un amarre.</p>{unidentified.map(r=><p className="coordinate-source" key={r.id}><strong>{r.description}</strong><br/>N {r.n} · E {r.e} · Z {r.z}{r.date&&<><br/>{r.date}</>}</p>)}</details>}
      <p className="setting-note">Usa un mismo sistema de coordenadas y metros, sin separadores de miles. N/E de E′ y F′ define el eje real. El catálogo contiene los amarres, no los pivotes ni los sellos. Cambiar Z de la referencia del nivel vacía su vista (+): debes observarla nuevamente.</p>
      <p className="setting-note">Si N/E de MC quedan ambas vacías se usa el punto medio entre E′ y F′. Si el mástil no está en ese punto, ingresa sus coordenadas. Las Z de pivotes y MC se conservan como referencia; no sustituyen las cotas de sello.</p>
      </div></details>
    <details><summary>Armado, cuadrantes y cero de estación</summary><div className="settings-section">
      <div className="settings-grid">
        <Select id="orientation-mode" label="Cálculo de orientación" value={p.survey.mode} onChange={v=>change(q=>({...q,survey:{...q.survey,mode:v as 'coordinates'|'axis'}}))}><option value="coordinates">Coordenadas reales N/E</option><option value="axis">Cuadrantes · R41 norte / R32 sur</option></Select>
        <Select id="pivot-mapping" label="Pivotes de armado" value={p.survey.mapping} onChange={v=>change(q=>({...q,survey:{...q.survey,mapping:v as 'F14'|'E14'}}))}><option value="F14">T1/T4 en F′ · T2/T3 en E′</option><option value="E14">T1/T4 en E′ · T2/T3 en F′</option></Select>
        <Select id="transverse-side" label="Numeración transversal" value={p.survey.side} onChange={v=>change(q=>({...q,survey:{...q.survey,side:v as 'standard'|'mirrored'}}))}><option value="standard">T1/T2 a −X · T3/T4 a +X</option><option value="mirrored">T1/T2 a +X · T3/T4 a −X</option></Select>
        <Select id="settings-zero" label="Cero del punto seleccionado (0°)" value={zeroFor(p,p.selected)} onChange={v=>change(q=>setPointZero(q,q.selected,v as 'R41'|'R32'))}><option>R41</option><option>R32</option></Select>
        <Select id="occupied-station" label="Estación del punto seleccionado" value={stationFor(p,p.selected)} onChange={value=>change(q=>setPointStation(q,q.selected,value as 'E'|'F'))}><option value="E">E′</option><option value="F">F′</option></Select>
        <Select id="mast-station" label="Armado para replantear MC" value={p.survey.mastStation} onChange={v=>change(q=>setPointStation(q,'MC',v as 'E'|'F'))}><option value="E">E′</option><option value="F">F′</option></Select>
      </div>
      <p className="setting-note">Eje local +Y de F′ hacia E′; +X queda a su derecha. En la disposición confirmada, +Y apunta al sur. «Cuadrantes» usa R41 al norte (−Y) y R32 al sur (+Y) desde el pivote. Usa coordenadas si no están perfectamente alineados. La disposición confirmada usa F′ para T1/T4 y E′ para T2/T3; se conserva editable para otras fichas. Comprueba la numeración en la planta.</p>
      <div className="guide-table"><table><caption>Giro horario Hz · desde el pivote de diseño de cada tirante</caption><thead><tr><th>Punto</th><th>Armado</th><th>R41</th><th>R32</th></tr></thead><tbody>{GUYS.map(id=><tr key={id}><td>T{id}</td><td>{pivotFor(p,id)}′</td>{(['R41','R32'] as const).map(z=>{const o=orientation(setPointZero(setPointStation(p,id,pivotFor(p,id)),id,z),id);return <td key={z}>{o.angle?angleLabel(o.angle):'—'}</td>;})}</tr>)}</tbody></table></div>
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
      <p className="setting-note">HI = Z de referencia + vista (+). La referencia del nivel es independiente del cero de la estación. Si cambias de referencia o mueves el nivel, toma una nueva vista (+). Cambiar la referencia vacía esa lectura para evitar reutilizar la anterior. Los sellos siguientes son los de diseño de cada punto.</p>
      <div className="settings-grid">{POINTS.map(id=><Field key={id} id={`seal-${id}`} label={`Sello diseño · ${id==='MC'?'MC':`T${id}`}`} value={id==='MC'?p.mast.sealDesign:p.guys[id].sealDesign} onChange={v=>seal(id,v)}/>)}</div>
      <div className="settings-level-summary">{POINTS.map(id=>{const l=leveling(p,id);return <div key={id}><span>{id==='MC'?'MC':`T${id}`} · Mira al sello</span><strong>{l.valid&&l.staff!==null?format(l.staff)+' m':'—'}</strong></div>;})}</div>
    </div></details>
    </div>
  </div>;
}
