'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, CircleHelp, Download, Eye, EyeOff, Layers2, Map, Mountain, RadioTower, Ruler, SlidersHorizontal, WifiOff, X } from 'lucide-react';
import { CATALOG } from '@/lib/catalog';
import { format, number } from '@/lib/geometry';
import { POINTS, inputFor, leveling, newTower, orientation, readTower, resultFor, stationFor, zeroFor, type GuyId, type PointId, type TowerProject } from '@/lib/tower';
import { restoreSession, STORAGE } from '@/lib/session';
import { CUSTOM_TOWERS_STORAGE, readCustomTowers, syncCustomTower, type CustomTower } from '@/lib/tower-references';
import { monitorPwa } from '@/lib/pwa';
import { Profile } from '@/components/diagram';
import { MastDiagram } from '@/components/mast-diagram';
import { AppHelp } from '@/components/app-help';
import { FieldGuide } from '@/components/field-guide';
import { Field, Select } from '@/components/form-controls';
import { TowerSettings } from '@/components/tower-settings';
import { SurveyPlan } from '@/components/survey-plan';
import { APP_CREDIT, APP_VERSION } from '@/lib/app-info';
import { ReleaseNotice } from '@/components/release-notice';
import { WorkflowTabs, type Workflow } from '@/components/workflow-tabs';
import { LevelResults, StakeoutResults } from '@/components/work-results';

type InstallEvent=Event&{prompt():Promise<void>;userChoice:Promise<{outcome:string}>};
const pointName=(id:PointId)=>(id==='MC'||id==='M1')?'MC · Mástil Central':`T${id} · Tirante ${id}`;
function download(name:string,value:string,type:string){const url=URL.createObjectURL(new Blob([value],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export default function Home(){
  const [p,setP]=useState<TowerProject>(newTower);
  const [settingsWorkflow,setSettingsWorkflow]=useState<Workflow>('stakeout');
  const [ready,setReady]=useState(false),[storageError,setStorageError]=useState(false),[compact,setCompact]=useState(false);
  const [view,setView]=useState<'profile'|'detail'|'plan'>('profile'),[showReference,setShowReference]=useState(true);
  const [settings,setSettings]=useState(false),[about,setAbout]=useState(false),[help,setHelp]=useState(false),[installHelp,setInstallHelp]=useState(false);
  const [customTowers,setCustomTowers]=useState<CustomTower[]>([]);
  const [offlineReady,setOfflineReady]=useState(false),[pwaError,setPwaError]=useState(false),[pwaUpdate,setPwaUpdate]=useState(false);
  const [install,setInstall]=useState<InstallEvent|null>(null),[notice,setNotice]=useState('');
  const fileRef=useRef<HTMLInputElement>(null),settingsButton=useRef<HTMLButtonElement>(null);
  const canSave=useRef(false);
  const isMast=p.selected==='MC'||p.selected==='M1',guy:GuyId=isMast?'1':p.selected as GuyId;
  const input=inputFor(p,guy),r=resultFor(p,guy);
  function openSettings(tab:Workflow=p.workflow){setSettingsWorkflow(tab);setSettings(true);}
  function changeSettingsTab(tab:Workflow){setSettingsWorkflow(tab);document.querySelector('.settings-body')?.scrollTo({top:0});}
  function persist(value:TowerProject){if(!canSave.current)return;try{localStorage.setItem(STORAGE,JSON.stringify(value));setStorageError(false);}catch{setStorageError(true);}}
  function closeModal(){if(ready)persist(p);setSettings(false);setAbout(false);setHelp(false);setInstallHelp(false);settingsButton.current?.focus();}
  useEffect(()=>{
    try{
      const session=restoreSession(localStorage);canSave.current=session.canSave;setStorageError(!session.canSave);
      if(session.project){setP(session.project);if(session.legacy)setNotice(`Sesión anterior recuperada en ${pointName(session.project.selected)}. Completa C y sellos de los otros puntos en Ajustes.`);}
      if(session.damaged)setNotice(session.recoveryKey?'La sesión guardada no se pudo abrir. Se conservó una copia de recuperación en este dispositivo. Importa una copia JSON válida para continuar.':'La sesión guardada no se pudo abrir. Guardado automático detenido para conservar los datos: exporta tu trabajo e importa una copia JSON válida.');
    }catch{canSave.current=false;setStorageError(true);}
    setReady(true);
    const media=window.matchMedia('(max-width: 600px)');const sync=()=>setCompact(media.matches);sync();if(media.matches)setView('detail');media.addEventListener('change',sync);
    const onInstall=(event:Event)=>{event.preventDefault();setInstall(event as InstallEvent);};const installed=()=>{setInstall(null);setNotice('Aplicación instalada.');};window.addEventListener('beforeinstallprompt',onInstall);window.addEventListener('appinstalled',installed);
    return()=>{media.removeEventListener('change',sync);window.removeEventListener('beforeinstallprompt',onInstall);window.removeEventListener('appinstalled',installed);};
  },[]);
  useEffect(()=>{if(ready)persist(p);},[p,ready]);
  function saveCustomTowers(list:CustomTower[]){setCustomTowers(list);try{localStorage.setItem(CUSTOM_TOWERS_STORAGE,JSON.stringify(list));}catch{setStorageError(true);}}
  useEffect(()=>{try{setCustomTowers(readCustomTowers(JSON.parse(localStorage.getItem(CUSTOM_TOWERS_STORAGE)??'[]')));}catch{}},[]);
  // Coordinates typed for a tower added on this device are kept for later searches.
  useEffect(()=>{if(!ready)return;const next=syncCustomTower(customTowers,p);if(next!==customTowers)saveCustomTowers(next);},[p,ready,customTowers]);
  useEffect(()=>{
    if(!('serviceWorker' in navigator)||process.env.NODE_ENV!=='production')return;
    let disposed=false,stop:(()=>void)|undefined;
    const monitor=(reg:ServiceWorkerRegistration)=>{if(!disposed)stop=monitorPwa(reg,()=>{setOfflineReady(true);setPwaError(false);},()=>setPwaUpdate(true));};
    navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(monitor).catch(async()=>{try{const previous=await navigator.serviceWorker.getRegistration('/');if(previous?.active){monitor(previous);return;}}catch{}if(!disposed)setPwaError(true);});
    return()=>{disposed=true;stop?.();};
  },[]);
  useEffect(()=>{
    if(!(settings||about||help||installHelp))return;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();closeModal();}if(event.key==='Tab'){const nodes=Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button,[role="dialog"] input,[role="dialog"] select,[role="dialog"] summary,[role="dialog"] a[href]')).filter(el=>!el.hasAttribute('disabled')&&el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
    document.addEventListener('keydown',escape);const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',escape);document.body.style.overflow=overflow;};
  },[settings,about,help,installHelp,p,ready]);
  function exportTower(){const results=Object.fromEntries(POINTS.map(id=>[id,{level:leveling(p,id),orientation:orientation(p,id),geometry:id==='MC'?null:resultFor(p,id)}]));download(`torre-${p.id.replace(/[^a-z0-9_-]/gi,'')||'sin-id'}.json`,JSON.stringify({schema:2,app:'Líneas & Tirantes',savedAt:new Date().toISOString(),project:p,references:CATALOG[p.tower],results},null,2),'application/json');setNotice('Torre exportada: cinco fichas, referencias, constantes y resultados.');}
  async function importTower(file:File|undefined){if(!file)return;try{if(file.size>1000000)throw Error();const restored=readTower(JSON.parse(await file.text()));if(!restored)throw Error();canSave.current=true;setP(restored);setNotice('Datos importados. Revisa referencias y armado antes de replantear.');}catch{setNotice('Archivo no compatible. Usa una torre JSON o un caso exportado por la versión anterior.');}if(fileRef.current)fileRef.current.value='';}
  function exportSvg(){const svg=document.querySelector('.diagram-canvas svg');if(!svg)return;const copy=svg.cloneNode(true) as SVGElement;copy.setAttribute('xmlns','http://www.w3.org/2000/svg');const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='text{font-family:Arial,sans-serif;fill:#444;font-size:12px}.svg-muted{font-size:11px;fill:#777}.svg-kicker{font-size:10px;letter-spacing:1px}.dimension{fill:none;stroke:#999;stroke-width:.8px}.dimension text{stroke:none;fill:#555}.ref-foundation{stroke:#aaa;fill:none;stroke-dasharray:5 4}';copy.prepend(style);download(`torre-${p.id}-${(p.selected==='MC'||p.selected==='M1')?'MC':`T${p.selected}`}-${view}.svg`,new XMLSerializer().serializeToString(copy),'image/svg+xml');}
  const offlineText=pwaUpdate?'Nueva versión descargada. La app se actualizará automáticamente conservando tus datos.':offlineReady?'Disponible sin conexión. Esta versión ya está guardada.':pwaError?'No se pudo preparar la descarga. Abre la app con conexión e inténtalo de nuevo.':'Preparando los archivos para usar sin conexión.';

  return <>
    {ready&&<ReleaseNotice paused={settings||about||help||installHelp}/>}
    <header className="app-header"><a className="brand" href="/" aria-label="Líneas y Tirantes, inicio"><span className="brand-mark"><RadioTower size={23} strokeWidth={1.4}/></span><span>Líneas <span className="brand-amp">&</span> Tirantes</span></a><div className="header-actions"><button className="button light install-button" aria-label="Instalar app" onClick={async()=>{if(install){await install.prompt();await install.userChoice;setInstall(null);}else setInstallHelp(true);}}><ArrowDownToLine size={18}/></button><button className="icon-button header-help" aria-label="Acerca de la app" onClick={()=>setAbout(true)}><CircleHelp size={20}/></button></div></header>
    {ready?<main className="tower-app">
      <WorkflowTabs prefix="work" value={p.workflow} onChange={workflow=>setP(q=>({...q,workflow}))}/>
      <div id="work-stakeout-panel" role="tabpanel" aria-labelledby="work-stakeout-tab" hidden={p.workflow!=='stakeout'}>
      <StakeoutResults project={p} change={setP} configure={()=>openSettings('stakeout')}/>
      <div className="diagram-switch"><button className="button light" aria-expanded={p.diagramsVisible} onClick={()=>setP(q=>({...q,diagramsVisible:!q.diagramsVisible}))}>{p.diagramsVisible?<EyeOff size={16}/>:<Eye size={16}/>} {p.diagramsVisible?'Ocultar diagramas':'Mostrar diagramas'}</button><span>{isMast?'MC · vértices · pivotes':'Perfil · anclaje · planta'}</span></div>
      {p.diagramsVisible&&<section className="tower-diagrams" aria-label="Diagramas de torre"><div className="drawing-toolbar"><div className="segmented">{!isMast&&<><button className={view==='profile'?'active':''} onClick={()=>setView('profile')}><Mountain size={15}/>Perfil</button><button className={view==='detail'?'active':''} onClick={()=>setView('detail')}><Ruler size={15}/>Anclaje</button></>}{isMast&&<button className="active" onClick={()=>setView('detail')}><Ruler size={15}/>Mástil</button>}{!isMast&&<button className={view==='plan'?'active':''} onClick={()=>setView('plan')}><Map size={15}/>Planta</button>}</div><div className="drawing-tools">{!isMast&&view!=='plan'&&<button className="layer-button" aria-label="Mostrar referencia de proyecto" aria-pressed={showReference} onClick={()=>setShowReference(v=>!v)}><Layers2 size={15}/>Proyecto</button>}<button className="icon-button" aria-label="Descargar dibujo SVG" onClick={exportSvg}><ArrowDownToLine size={17}/></button></div></div><div className="diagram-canvas">{isMast?<MastDiagram project={p}/>:view==='plan'?<SurveyPlan project={p}/>:r.valid?<Profile input={input} r={r} detail={view==='detail'} compact={compact} showReference={showReference}/>:<p className="invalid-drawing">Completa C y los datos del tirante para mostrar su perfil.</p>}</div><div className="drawing-caption">{isMast?`Mástil central ${format(number(p.mast.side??'2.8'))} × ${format(number(p.mast.side??'2.8'))} m · Estación ${stationFor(p,'MC')}′ · Cero en ${zeroFor(p,'MC')}. Vértices MC1–MC4.`:(isMast||view==='plan'?'Cada tirante usa su propia C y φ. Coordenadas del borde sin K.':'C y β fijos · perfil esquemático · X al borde de viga')}</div></section>}

      </div>
      <div id="work-level-panel" role="tabpanel" aria-labelledby="work-level-tab" hidden={p.workflow!=='level'}>
      <LevelResults project={p} change={setP} configure={()=>openSettings('level')}/>
      {isMast?<details className="point-data"><summary>Cotas del mástil central</summary><section><h2>Nivelación · MC</h2><p className="point-note">El mástil usa su propio sello. Las distancias C/X y β corresponden a tirantes y no se aplican a MC.</p><div className="point-grid"><Field id="mast-design" label="Cota de sello de diseño · MC" value={p.mast.sealDesign} onChange={v=>setP(q=>({...q,mast:{...q.mast,sealDesign:v}}))}/></div></section></details>:null}
      </div>
      <footer><span>RUMBO3D / LÍNEAS &amp; TIRANTES</span><p>Geometría y nivelación de apoyo al replanteo · cinco puntos por torre</p><span data-testid="footer-version">v{APP_VERSION} · PWA</span><p className="app-credit">{APP_CREDIT}</p></footer>
    </main>:<main className="tower-app"><p className="point-note" role="status">Recuperando la torre guardada…</p></main>}
    {ready&&<section className="workbar" aria-label="Torre y punto de trabajo"><div className="workbar-tower"><span className="tiny-label">TORRE</span><strong title={p.id} aria-label="Torre seleccionada">{p.id||'Sin ID'}</strong></div><Select id="point-select" label="Punto de trabajo" value={p.selected} onChange={selected=>setP(q=>({...q,selected:selected as PointId}))}>{POINTS.map(id=><option key={id} value={id}>{pointName(id)}</option>)}</Select><button ref={settingsButton} className="button primary" onClick={()=>openSettings()}><SlidersHorizontal size={17}/><span>Ajustes</span></button></section>}
    {notice&&<div className="toast" role="status"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {(settings||about||help||installHelp)&&<div className="modal-backdrop" onClick={closeModal}><section className={`modal ${settings?'settings-modal':help?'guide-modal':''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e=>e.stopPropagation()}>
      {settings?<><div className="settings-header"><div><span className="tiny-label">TORRE {p.id||'SIN ID'}</span><h2 id="modal-title">Ajustes de torre</h2></div><button autoFocus className="icon-button" aria-label="Guardar y cerrar ajustes" onClick={closeModal}><X size={20}/></button></div><WorkflowTabs prefix="settings" value={settingsWorkflow} onChange={changeSettingsTab}/><div className="settings-body"><TowerSettings project={p} change={setP} tab={settingsWorkflow} custom={customTowers} setCustom={saveCustomTowers}/><details className="settings-files"><summary>Archivos de torre</summary><p>{p.tower} · S{p.soil} · {storageError?'No se pudo guardar en este dispositivo':'Guardado en este dispositivo'}</p><div><button className="button light" onClick={()=>fileRef.current?.click()}><Download size={15} className="rotate-180"/>Importar torre o caso</button><input ref={fileRef} type="file" className="hidden" accept=".json,application/json" onChange={e=>importTower(e.target.files?.[0])}/><button className="button light" onClick={exportTower}><Download size={15}/>Exportar torre</button></div></details></div><div className="settings-footer"><span>{storageError?'Guardado local no disponible: exporta una copia.':'Los cambios se guardan en este dispositivo.'}</span><button className="button primary" onClick={closeModal}>Guardar y cerrar</button></div></>:<>
        <button autoFocus className="modal-close icon-button" aria-label="Cerrar diálogo" onClick={closeModal}><X size={20}/></button>
        {about?<AppHelp offlineText={offlineText} onReferences={()=>{setAbout(false);setHelp(true);}}/>:help?<FieldGuide/>:<><h2 id="modal-title">Instalar y usar sin conexión</h2><p>En Chrome o Edge, usa la opción «Instalar aplicación» del navegador. En iPhone, abre Safari y elige Compartir → Añadir a pantalla de inicio.</p><p>Abre primero la app con internet y espera «Disponible sin conexión». Antes de salir a terreno, comprueba que abre y calcula en modo avión. Los datos de la torre, las tablas y la guía quedan disponibles en el dispositivo.</p><p>Guarda una copia JSON desde Ajustes → Archivos de torre para respaldar el trabajo.</p><div className="install-state"><WifiOff size={19}/>{offlineText}</div></>}
      </>}
    </section></div>}
  </>;
}
