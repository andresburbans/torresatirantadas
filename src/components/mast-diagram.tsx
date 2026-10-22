import { format, number } from '@/lib/geometry';
import { stationFor, zeroFor, type TowerProject } from '@/lib/tower';

export function MastDiagram({project:p}:{project:TowerProject}){
  const station=stationFor(p,'MC'),zero=zeroFor(p,'MC');
  const distance=number(p.pivot),offset=number(p.mast.offset??'0');
  const valid=Number.isFinite(distance)&&distance>0&&Number.isFinite(offset)&&1.4+offset>0;
  const cx=220,cy=230,scale=valid?160/Math.max(distance,1.4+offset,1.4):45;
  const half=1.4*scale,expanded=valid?(1.4+offset)*scale:half;
  const fy=cy-(valid?distance*scale:160),ey=cy+(valid?distance*scale:160);
  const corners=[{id:'MC1',x:1,y:-1},{id:'MC2',x:1,y:1},{id:'MC3',x:-1,y:1},{id:'MC4',x:-1,y:-1}];
  return <svg className="survey-plan technical-svg mast-diagram-svg" viewBox="0 0 440 470" role="img" aria-label="Mástil central con MC1 arriba derecha, MC2 abajo derecha, MC3 abajo izquierda y MC4 arriba izquierda; eje R41, F′, MC, E′, R32">
    <defs><pattern id="mast-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="#ddd"/></pattern></defs>
    <rect width="440" height="470" fill="url(#mast-dots)"/>
    <path d={`M${cx} 32V428`} stroke="#aaa" strokeDasharray="5 5" fill="none"/>
    <text x={cx} y="22" textAnchor="middle">R41</text>
    <text x={cx} y="445" textAnchor="middle">R32</text>
    <path d={`M${cx-half} ${cy-half}L${cx} ${fy}L${cx+half} ${cy-half} M${cx-half} ${cy+half}L${cx} ${ey}L${cx+half} ${cy+half}`} stroke="#666" fill="none"/>
    <rect x={cx-half} y={cy-half} width={2*half} height={2*half} fill="none" stroke="#444" strokeWidth="2"/>
    <path d={`M${cx-half} ${cy}H${cx+half} M${cx} ${cy-half}V${cy+half}`} stroke="#999"/>
    <rect x={cx-half*.32} y={cy-half*.32} width={half*.64} height={half*.64} fill="none" stroke="#555" strokeWidth="1.5"/>
    <text x={cx+5} y={cy-6}>MC</text>
    {valid&&offset!==0&&<rect x={cx-expanded} y={cy-expanded} width={2*expanded} height={2*expanded} fill="none" stroke="#777" strokeDasharray="5 4"/>}
    {corners.map(c=><g key={c.id}>
      <circle cx={cx+c.x*expanded} cy={cy+c.y*expanded} r="3" fill="#444"/>
      <text x={cx+c.x*expanded+c.x*8} y={cy+c.y*expanded+c.y*12+4} textAnchor={c.x>0?'start':'end'}>{c.id}</text>
    </g>)}
    {[-1,1].map(sign=><g key={sign}>
      <text x={cx+sign*half/2} y={cy-half-9} textAnchor="middle" className="svg-muted">1.4 m</text>
      <text x={cx+sign*half/2} y={cy+half+22} textAnchor="middle" className="svg-muted">1.4 m</text>
      <text x={cx-half-12} y={cy+sign*half/2+4} textAnchor="end" className="svg-muted">1.4 m</text>
      <text x={cx+half+12} y={cy+sign*half/2+4} className="svg-muted">1.4 m</text>
    </g>)}
    {(['F','E'] as const).map(id=>{const y=id==='F'?fy:ey;return <g key={id}>
      {station===id&&<circle cx={cx} cy={y} r="9" fill="none" stroke="#444" strokeDasharray="3 3"/>}
      <circle cx={cx} cy={y} r="3" fill="#333"/>
      <text x={cx-14} y={y+4} textAnchor="end">{id}′</text>
      {station===id&&<text x={cx+15} y={y+4} className="svg-muted">Estación · 0° a {zero}</text>}
    </g>;})}
    <text x="20" y="463" className="svg-muted">{valid?`MC → pivote ${format(distance)} m · Offset ${format(offset)} m`:'Completa distancia y offset para definir la geometría.'}</text>
  </svg>;
}
