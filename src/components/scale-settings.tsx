import { format } from '@/lib/geometry';
import { baselineScale } from '@/lib/survey';
import type { TowerProject } from '@/lib/tower';
import { Field } from './form-controls';

export function ScaleSettings({project:p,change}:{project:TowerProject;change:(fn:(p:TowerProject)=>TowerProject)=>void}){
  const s=baselineScale(p);
  return <details className="scale-settings"><summary>Factor de escala · R41 ↔ R32</summary><div className="settings-section">
    <div className="settings-reference"><span>Distancia teórica planimétrica · R41–R32</span><strong data-testid="baseline-theoretical">{s.theoretical===null?'—':format(s.theoretical,6)+' m'}</strong></div>
    <Field id="baseline-measured" label="Distancia horizontal medida con estación" value={p.survey.baselineDistance} onChange={baselineDistance=>change(q=>({...q,survey:{...q.survey,baselineDistance}}))} hint="DH entre los mismos amarres; no distancia inclinada ni una lectura ya escalada."/>
    <div className="scale-result"><span>Factor de escala · menor / mayor</span><strong data-testid="settings-scale">{s.valid?format(s.factor!,6):'—'}</strong><small>k = DH menor / DH mayor</small></div>
    {(p.survey.baselineDistance.trim()!==''||s.theoretical===null)&&s.errors.map(error=><p className="setting-note" key={error}>{error}</p>)}
    <p className="setting-note">Cambiar la torre o N/E de los amarres vacía la distancia medida para evitar reutilizar otra medición.</p>
    <p className="setting-note">Solo es un valor de referencia para la estación total. No se aplica a C + X₁ + K, a coordenadas, giros, profundidades ni cotas.</p>
  </div></details>;
}
