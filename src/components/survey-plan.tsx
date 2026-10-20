import { format, number } from '@/lib/geometry';
import { localPlan, type TowerProject } from '@/lib/tower';

export function SurveyPlan({project:p}:{project:TowerProject}){
  const points=localPlan(p),e=number(p.pivot),pivot=Number.isFinite(e)?e:0;
  const extent=Math.max(...points.flatMap(q=>q.position?[Math.abs(q.position.x),Math.abs(q.position.y)]:[]),Math.abs(pivot),1);
  const scale=120/extent,cx=220,cy=170;
  return <svg className="survey-plan technical-svg" viewBox="0 0 440 350" role="img" aria-label="Planta de torre con datos independientes de T1 a T4 y M1; eje Y desde F prima hacia E prima">
    <defs><pattern id="survey-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="#ddd"/></pattern></defs>
    <rect width="440" height="350" fill="url(#survey-dots)"/>
    <path d={`M30 ${cy}H410 M${cx} 25V315`} stroke="#aaa" strokeDasharray="5 5" fill="none"/>
    <text x="248" y="24">+Y · F′ → E′</text><text x="387" y="158">+X</text>
    {p.survey.mode==='axis'&&<><text x="20" y="24">R32 · Sur</text><text x="20" y="309">R41 · Norte</text></>}
    <rect x={cx-20} y={cy-8} width="40" height="16" fill="#e3e3e3" stroke="#444"/>
    <path d={`M${cx-20} ${cy-8}L${cx} ${cy-pivot*scale}L${cx+20} ${cy-8} M${cx-20} ${cy+8}L${cx} ${cy+pivot*scale}L${cx+20} ${cy+8}`} fill="none" stroke="#666"/>
    <circle cx={cx} cy={cy} r={p.selected==='M1'?5:3} fill="#333"/><text x={cx+28} y={cy+5}>M1</text>
    {(['E','F'] as const).map(id=>{const y=cy+(id==='E'?-1:1)*pivot*scale;return <g key={id}><circle cx={cx} cy={y} r="3" fill="#333"/><text x={cx+7} y={y+(id==='E'?-8:16)}>{id}′</text></g>;})}
    {points.map(q=>{if(!q.position)return null;const x=cx+q.position.x*scale,y=cy-q.position.y*scale,py=cy+(q.station==='E'?-1:1)*pivot*scale,selected=p.selected===q.id;return <g key={q.id}><path d={`M${cx} ${py}L${x} ${y}`} stroke={selected?'#222':'#aaa'} strokeWidth={selected?2:1}/><rect x={x-5} y={y-5} width="10" height="10" fill={selected?'#555':'#ddd'} stroke="#777"/><text x={x+(x<cx?-26:10)} y={y+5}>T{q.id}</text></g>;})}
    <text x="20" y="333" className="svg-muted">Borde C + X₁ · sin K · puntos sin C válido no se dibujan</text>
  </svg>;
}
