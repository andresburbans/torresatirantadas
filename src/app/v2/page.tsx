'use client';
import { useEffect, useRef, useState } from 'react';
import { CopyPlus, Download, Eye, EyeOff, FilePlus2, Map, Mountain, RadioTower, SlidersHorizontal, Trash2, WifiOff, X } from 'lucide-react';
import { MAX_SPANS, PHASE_NAMES, SPAN_STORAGE, SPAN_STORAGE_V1, addSpan, currentSpan, exampleSpan, logCsv, newId, newSpan, nextSpan, phaseGeometry, readSpan, readStore, removeSpan, sagTarget, storeOf, updateCurrent, type PhaseId, type SpanProject, type SpanStore } from '@/lib/span';
import { monitorPwa } from '@/lib/pwa';
import { Select } from '@/components/form-controls';
import { SpanPlan, SpanProfile } from '@/components/span-diagram';
import { SpanResults, phaseOptions } from '@/components/span-results';
import { SpanSettings, type SpanSettingsTab } from '@/components/span-settings';
import { APP_CREDIT, APP_VERSION } from '@/lib/app-info';

const settingsTabs = [['shots', 'Lecturas'], ['design', 'Proyecto']] as const;
const spanLabel = (p: SpanProject, i: number) => p.name.trim() || `Vano sin nombre ${i + 1}`;
function download(name: string, value: string, type: string) { const url = URL.createObjectURL(new Blob([value], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const fileSafe = (text: string) => text.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'sin-nombre';

/** Vista previa del módulo de templado. Guarda aparte de la sesión de torre. */
export default function SpanPreview() {
  const [store, setStore] = useState<SpanStore>(() => storeOf(exampleSpan()));
  const [ready, setReady] = useState(false), [settings, setSettings] = useState(false), [tab, setTab] = useState<SpanSettingsTab>('shots');
  const [diagrams, setDiagrams] = useState(true), [view, setView] = useState<'profile' | 'plan'>('profile'), [notice, setNotice] = useState('');
  const [offline, setOffline] = useState(false), [storageError, setStorageError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null), canSave = useRef(true);
  const p = currentSpan(store), setP = (fn: (q: SpanProject) => SpanProject) => setStore(s => updateCurrent(s, fn));
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SPAN_STORAGE) ?? localStorage.getItem(SPAN_STORAGE_V1);
      if (saved) {
        let value: SpanStore | null = null;
        try { value = readStore(JSON.parse(saved)); } catch { }
        // Un almacén ilegible no se sobrescribe: se conserva una copia y se avisa.
        if (value) setStore(value); else { try { localStorage.setItem(`${SPAN_STORAGE}-recovery`, saved); } catch { canSave.current = false; } setNotice('Los vanos guardados no se pudieron abrir. Se conservó una copia de recuperación en este dispositivo.'); }
      }
    } catch { canSave.current = false; setStorageError(true); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready && canSave.current) try { localStorage.setItem(SPAN_STORAGE, JSON.stringify(store)); setStorageError(false); } catch { setStorageError(true); } }, [store, ready]);
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return;
    let disposed = false, stop: (() => void) | undefined;
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => { if (!disposed) stop = monitorPwa(reg, () => setOffline(true), () => { }); }).catch(() => { });
    return () => { disposed = true; stop?.(); };
  }, []);
  useEffect(() => {
    if (!settings) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSettings(false); };
    document.addEventListener('keydown', escape); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', escape); document.body.style.overflow = overflow; };
  }, [settings]);
  const g = phaseGeometry(p, p.selected), target = sagTarget(p, p.selected), index = store.spans.findIndex(s => s.id === p.id);
  function exportSpan() { download(`vano-${fileSafe(p.name)}.json`, JSON.stringify({ app: 'Líneas & Tirantes', kind: 'vano', savedAt: new Date().toISOString(), span: p }, null, 2), 'application/json'); }
  function exportLog() { download(`registro-templado-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + logCsv(store.spans), 'text/csv;charset=utf-8'); setNotice('Registro exportado: todas las lecturas guardadas de todos los vanos.'); }
  async function importSpan(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error();
      const value = readSpan(JSON.parse(await file.text())?.span);
      if (!value) throw Error();
      if (store.spans.length >= MAX_SPANS) { setNotice(`Hay ${MAX_SPANS} vanos guardados. Elimina alguno antes de importar.`); return; }
      // Se importa como vano nuevo: nunca sobrescribe el de trabajo.
      setStore(s => addSpan(s, { ...value, id: s.spans.some(x => x.id === value.id) ? newId() : value.id }));
      setNotice('Vano importado como vano nuevo. Revisa las lecturas antes de flechar.');
    } catch { setNotice('Archivo no compatible. Usa un vano exportado desde esta pantalla.'); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }
  function add(span: SpanProject, text: string) { if (store.spans.length >= MAX_SPANS) { setNotice(`Máximo ${MAX_SPANS} vanos en el dispositivo. Exporta y elimina los terminados.`); return; } setStore(s => addSpan(s, span)); setNotice(text); }
  function remove() { if (!window.confirm(`¿Eliminar «${spanLabel(p, index)}» y su registro de lecturas? No se puede deshacer.`)) return; setStore(s => removeSpan(s, p.id)); setNotice('Vano eliminado.'); }

  return <>
    <header className="app-header"><a className="brand" href="/" aria-label="Líneas y Tirantes, inicio"><span className="brand-mark"><RadioTower size={23} strokeWidth={1.4} /></span><span>Líneas <span className="brand-amp">&</span> Tirantes</span></a><div className="header-actions"><span className="preview-badge">Vista previa</span></div></header>
    <main className="tower-app">
      <div className="segmented workflow-tabs" role="group" aria-label="Pantallas de trabajo"><button type="button" onClick={() => { location.href = '/'; }}>Replanteo</button><button type="button" onClick={() => { location.href = '/'; }}>Nivelación</button><button type="button" aria-current="page" className="active">Templado</button></div>
      <p className="preview-note">Propuesta del módulo de templado de conductores. No forma parte de la versión publicada: Replanteo y Nivelación vuelven a la app actual. Los vanos de esta pantalla se guardan aparte.</p>
      {ready ? <>
        <SpanResults project={p} change={setP} configure={() => { setTab(target.error?.includes('tabla') || target.error?.includes('Proyecto') ? 'design' : 'shots'); setSettings(true); }} exportLog={exportLog} notify={setNotice} />
        <div className="diagram-switch"><button className="button light" aria-expanded={diagrams} onClick={() => setDiagrams(v => !v)}>{diagrams ? <EyeOff size={16} /> : <Eye size={16} />} {diagrams ? 'Ocultar diagramas' : 'Mostrar diagramas'}</button><span>Perfil · planta</span></div>
        {diagrams && <section className="tower-diagrams" aria-label="Diagramas del vano"><div className="drawing-toolbar"><div className="segmented"><button className={view === 'profile' ? 'active' : ''} onClick={() => setView('profile')}><Mountain size={15} />Perfil</button><button className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}><Map size={15} />Planta</button></div></div>
          <div className="diagram-canvas">{g.valid && target.valid ? view === 'profile' ? <SpanProfile g={g} sag={target.sag} /> : <SpanPlan g={g} unit={p.angleUnit} /> : <p className="invalid-drawing">Completa las lecturas y la tabla de templado para dibujar el vano.</p>}</div>
          <div className="drawing-caption">{view === 'profile' ? 'Cotas respecto del eje del instrumento · escala vertical exagerada · conductor como parábola' : 'Estación en el origen · cero del círculo hacia arriba'}</div></section>}
      </> : <p className="point-note" role="status">Recuperando los vanos guardados…</p>}
      <footer><span>RUMBO3D / LÍNEAS &amp; TIRANTES</span><p>Templado de conductores con estación total · vista previa</p><span className="span-offline">{offline ? <><WifiOff size={12} /> Disponible sin conexión · </> : null}v{APP_VERSION}</span><p className="app-credit">{APP_CREDIT}</p></footer>
    </main>
    {ready && <section className="workbar span-workbar" aria-label="Vano y conductor de trabajo"><Select id="span-select" label={`Vano · ${index + 1}/${store.spans.length}`} value={p.id} onChange={id => setStore(s => ({ ...s, current: id }))}>{store.spans.map((s, i) => <option key={s.id} value={s.id}>{spanLabel(s, i)}</option>)}</Select><Select id="phase-select" label="Conductor" value={p.selected} onChange={selected => setP(q => ({ ...q, selected: selected as PhaseId }))}>{phaseOptions(p).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</Select><button className="button primary" onClick={() => setSettings(true)}><SlidersHorizontal size={17} /><span>Ajustes</span></button></section>}
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={15} /></button></div>}
    {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
      <div className="settings-header"><div><span className="tiny-label">VANO {p.name || 'SIN NOMBRE'} · {PHASE_NAMES[p.selected].toUpperCase()}</span><h2 id="modal-title">Ajustes de templado</h2></div><button autoFocus className="icon-button" aria-label="Guardar y cerrar ajustes" onClick={() => setSettings(false)}><X size={20} /></button></div>
      <div className="segmented workflow-tabs" role="tablist" aria-label="Secciones de ajustes">{settingsTabs.map(([id, label]) => <button type="button" role="tab" id={`span-${id}-tab`} aria-controls={`span-${id}-panel`} aria-selected={tab === id} className={tab === id ? 'active' : ''} key={id} onClick={() => { setTab(id); document.querySelector('.settings-body')?.scrollTo({ top: 0 }); }}>{label}</button>)}</div>
      <div className="settings-body"><SpanSettings project={p} change={setP} tab={tab} />
        <details className="settings-files" open={tab === 'design'}><summary>Vanos guardados · {store.spans.length}</summary><p>Cada vano guarda sus lecturas y su registro. «Siguiente vano del cantón» copia conductor, tablas, Δ vertical y tolerancias, y deja las lecturas vacías.</p><div>
          <button className="button light" data-testid="span-next" onClick={() => add(nextSpan(p), 'Siguiente vano creado con la misma tabla. Ponle nombre y anota las lecturas.')}><CopyPlus size={15} />Siguiente vano del cantón</button>
          <button className="button light" onClick={() => add(newSpan(), 'Vano vacío creado.')}><FilePlus2 size={15} />Vano vacío</button>
          <button className="button light" onClick={remove}><Trash2 size={15} />Eliminar este vano</button>
        </div></details>
        <details className="settings-files"><summary>Archivos y ejemplo</summary><p>{storageError ? 'No se pudo guardar en este dispositivo: exporta una copia.' : 'Los vanos se guardan en este dispositivo.'}</p><div>
          <button className="button light" onClick={() => fileRef.current?.click()}><Download size={15} className="rotate-180" />Importar vano</button><input ref={fileRef} type="file" className="hidden" accept=".json,application/json" onChange={e => importSpan(e.target.files?.[0])} />
          <button className="button light" onClick={exportSpan}><Download size={15} />Exportar este vano</button>
          <button className="button light" disabled={!store.spans.some(s => s.log.length)} onClick={exportLog}><Download size={15} />Registro CSV</button>
          <button className="button light" onClick={() => add(exampleSpan(), 'Ejemplo T.122 – T.124 cargado como vano nuevo.')}>Cargar ejemplo T.122 – T.124</button>
        </div></details></div>
      <div className="settings-footer"><span>{storageError ? 'Guardado local no disponible.' : 'Los cambios se guardan en este dispositivo.'}</span><button className="button primary" onClick={() => setSettings(false)}>Guardar y cerrar</button></div>
    </section></div>}
  </>;
}
