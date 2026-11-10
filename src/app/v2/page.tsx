'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, Eye, EyeOff, Map, Mountain, RadioTower, SlidersHorizontal, X } from 'lucide-react';
import { PHASE_NAMES, SPAN_STORAGE, exampleSpan, isSpan, newSpan, phaseGeometry, sagTarget, type PhaseId, type SpanProject } from '@/lib/span';
import { Select } from '@/components/form-controls';
import { SpanPlan, SpanProfile } from '@/components/span-diagram';
import { SpanResults, phaseOptions } from '@/components/span-results';
import { SpanSettings, type SpanSettingsTab } from '@/components/span-settings';
import { APP_CREDIT, APP_VERSION } from '@/lib/app-info';

const settingsTabs = [['shots', 'Lecturas'], ['design', 'Proyecto']] as const;

/** Vista previa del módulo de templado. Guarda aparte de la sesión de torre. */
export default function SpanPreview() {
  const [p, setP] = useState<SpanProject>(exampleSpan);
  const [ready, setReady] = useState(false), [settings, setSettings] = useState(false), [tab, setTab] = useState<SpanSettingsTab>('shots');
  const [diagrams, setDiagrams] = useState(true), [view, setView] = useState<'profile' | 'plan'>('profile'), [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try { const saved = localStorage.getItem(SPAN_STORAGE); if (saved) { const value: unknown = JSON.parse(saved); if (isSpan(value)) setP(value); } } catch { }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(SPAN_STORAGE, JSON.stringify(p)); } catch { } }, [p, ready]);
  useEffect(() => {
    if (!settings) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSettings(false); };
    document.addEventListener('keydown', escape); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', escape); document.body.style.overflow = overflow; };
  }, [settings]);
  const g = phaseGeometry(p, p.selected), target = sagTarget(p, p.selected);
  function exportSpan() { const url = URL.createObjectURL(new Blob([JSON.stringify({ app: 'Líneas & Tirantes', kind: 'vano', savedAt: new Date().toISOString(), span: p }, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `vano-${p.name.replace(/[^a-z0-9_-]+/gi, '-') || 'sin-nombre'}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  async function importSpan(file: File | undefined) {
    if (!file) return;
    try { if (file.size > 1000000) throw Error(); const value = JSON.parse(await file.text()); if (!isSpan(value?.span)) throw Error(); setP(value.span); setNotice('Vano importado. Revisa las lecturas antes de flechar.'); } catch { setNotice('Archivo no compatible. Usa un vano exportado desde esta pantalla.'); }
    if (fileRef.current) fileRef.current.value = '';
  }

  return <>
    <header className="app-header"><a className="brand" href="/" aria-label="Líneas y Tirantes, inicio"><span className="brand-mark"><RadioTower size={23} strokeWidth={1.4} /></span><span>Líneas <span className="brand-amp">&</span> Tirantes</span></a><div className="header-actions"><span className="preview-badge">Vista previa</span></div></header>
    <main className="tower-app">
      <div className="segmented workflow-tabs" role="tablist" aria-label="Pantallas de trabajo"><button type="button" role="tab" aria-selected={false} onClick={() => { location.href = '/'; }}>Replanteo</button><button type="button" role="tab" aria-selected={false} onClick={() => { location.href = '/'; }}>Nivelación</button><button type="button" role="tab" aria-selected className="active">Templado</button></div>
      <p className="preview-note">Propuesta del módulo de templado de conductores. No forma parte de la versión publicada: Replanteo y Nivelación vuelven a la app actual. Los datos de esta pantalla se guardan aparte.</p>
      {ready ? <>
        <SpanResults project={p} change={setP} configure={() => { setTab('shots'); setSettings(true); }} />
        <div className="diagram-switch"><button className="button light" aria-expanded={diagrams} onClick={() => setDiagrams(v => !v)}>{diagrams ? <EyeOff size={16} /> : <Eye size={16} />} {diagrams ? 'Ocultar diagramas' : 'Mostrar diagramas'}</button><span>Perfil · planta</span></div>
        {diagrams && <section className="tower-diagrams" aria-label="Diagramas del vano"><div className="drawing-toolbar"><div className="segmented"><button className={view === 'profile' ? 'active' : ''} onClick={() => setView('profile')}><Mountain size={15} />Perfil</button><button className={view === 'plan' ? 'active' : ''} onClick={() => setView('plan')}><Map size={15} />Planta</button></div></div>
          <div className="diagram-canvas">{g.valid && target.valid ? view === 'profile' ? <SpanProfile g={g} sag={target.sag} /> : <SpanPlan g={g} unit={p.angleUnit} /> : <p className="invalid-drawing">Completa las lecturas y la tabla de templado para dibujar el vano.</p>}</div>
          <div className="drawing-caption">{view === 'profile' ? 'Cotas respecto del eje del instrumento · escala vertical exagerada · conductor como parábola' : 'Estación en el origen · cero del círculo hacia arriba'}</div></section>}
      </> : <p className="point-note" role="status">Recuperando el vano guardado…</p>}
      <footer><span>RUMBO3D / LÍNEAS &amp; TIRANTES</span><p>Templado de conductores con estación total · vista previa</p><span>v{APP_VERSION} · vista previa</span><p className="app-credit">{APP_CREDIT}</p></footer>
    </main>
    {ready && <section className="workbar" aria-label="Vano y conductor de trabajo"><div className="workbar-tower"><span className="tiny-label">VANO</span><strong title={p.name}>{p.name || 'Sin nombre'}</strong></div><Select id="phase-select" label="Conductor" value={p.selected} onChange={selected => setP(q => ({ ...q, selected: selected as PhaseId }))}>{phaseOptions(p).map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</Select><button className="button primary" onClick={() => setSettings(true)}><SlidersHorizontal size={17} /><span>Ajustes</span></button></section>}
    {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => setNotice('')}><X size={15} /></button></div>}
    {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
      <div className="settings-header"><div><span className="tiny-label">VANO {p.name || 'SIN NOMBRE'} · {PHASE_NAMES[p.selected].toUpperCase()}</span><h2 id="modal-title">Ajustes de templado</h2></div><button autoFocus className="icon-button" aria-label="Guardar y cerrar ajustes" onClick={() => setSettings(false)}><X size={20} /></button></div>
      <div className="segmented workflow-tabs" role="tablist" aria-label="Secciones de ajustes">{settingsTabs.map(([id, label]) => <button type="button" role="tab" id={`span-${id}-tab`} aria-controls={`span-${id}-panel`} aria-selected={tab === id} className={tab === id ? 'active' : ''} key={id} onClick={() => { setTab(id); document.querySelector('.settings-body')?.scrollTo({ top: 0 }); }}>{label}</button>)}</div>
      <div className="settings-body"><SpanSettings project={p} change={setP} tab={tab} />
        <details className="settings-files"><summary>Archivos y ejemplo</summary><div><button className="button light" onClick={() => { setP(exampleSpan()); setNotice('Ejemplo T.122 – T.124 cargado.'); }}>Cargar ejemplo T.122 – T.124</button><button className="button light" onClick={() => { setP(newSpan()); setNotice('Vano vacío.'); }}>Vaciar vano</button><button className="button light" onClick={() => fileRef.current?.click()}><Download size={15} className="rotate-180" />Importar vano</button><input ref={fileRef} type="file" className="hidden" accept=".json,application/json" onChange={e => importSpan(e.target.files?.[0])} /><button className="button light" onClick={exportSpan}><Download size={15} />Exportar vano</button></div></details></div>
      <div className="settings-footer"><span>Los cambios se guardan en este dispositivo.</span><button className="button primary" onClick={() => setSettings(false)}>Guardar y cerrar</button></div>
    </section></div>}
  </>;
}
