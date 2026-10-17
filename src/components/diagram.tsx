import type { Inputs, Result } from '@/lib/geometry';
import { angleLabel, format } from '@/lib/geometry';

function Dim({ x1, x2, y, text, dark = false }: { x1: number; x2: number; y: number; text: string; dark?: boolean }) {
  return <g className={dark ? 'dimension strong' : 'dimension'}><path d={`M${x1},${y-6}v12 M${x2},${y-6}v12 M${x1},${y}H${x2}`} /><text x={(x1+x2)/2} y={y-9} textAnchor="middle">{text}</text></g>;
}
function VDim({ x, y1, y2, text }: { x: number; y1: number; y2: number; text: string }) {
  return <g className="dimension"><path d={`M${x-5},${y1}h10 M${x-5},${y2}h10 M${x},${y1}V${y2}`} /><text transform={`translate(${x-10},${(y1+y2)/2}) rotate(-90)`} textAnchor="middle">{text}</text></g>;
}
function MobileSection({ input, r, showReference }: { input: Inputs; r: Result; showReference: boolean }) {
  const beta=r.beta*Math.PI/180, t=Math.tan(beta);
  const terrain=input.datum==='terrain'?Math.tan(r.alpha*Math.PI/180):0;
  const maxExtent=Math.max(r.h0,r.h0+r.deltaX*t,r.x0+1.3,r.x1+1.3,3);
  const scale=Math.min(39,145/maxExtent), ax=88, gy=102;
  const x0=ax+r.x0*scale, x1=ax+r.x1*scale;
  const floor0=gy+r.h0*scale, floor1=gy+(r.h0+r.deltaX*t)*scale;
  const dimensionY=Math.max(floor0,floor1)+27;
  const beam=(x:number,y:number,ref:boolean)=><g className={ref?'ref-foundation':'foundation'}><rect x={x} y={y-scale} width={scale} height={scale} fill={ref?'none':'url(#mobile-concrete)'}/><path d={`M${x},${y-scale-10}V${y+8}`} strokeDasharray="4 4"/></g>;
  return <svg className="technical-svg mobile-section-svg" viewBox="0 0 360 330" role="img" aria-label={`Detalle del anclaje. X ajustada ${format(r.x1)} metros; excavación ${format(r.h1)} metros. Esquema sin escala constructiva.`}>
    <defs><pattern id="mobile-grid" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#dddddd"/></pattern><pattern id="mobile-concrete" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#e7e7e7"/><path d="M0 8 8 0" stroke="#c5c5c5" strokeWidth=".7"/></pattern></defs>
    <rect width="360" height="330" fill="url(#mobile-grid)"/>
    <text x="18" y="25" className="mobile-beta">β {angleLabel(input.beta)}</text>
    <text x="112" y="54" className="mobile-annotation">C fijo · afloramiento</text>
    <text x="211" y="78" className="mobile-annotation">α {format(input.datum==='terrain'?r.alpha:0,1)}°</text>
    <g fill="none" strokeWidth="1.2">
      <path d={`M18,${gy}H${ax}L280,${gy+(280-ax)*terrain}`} stroke="#888888"/>
      <path d={`M${ax},${gy}V${dimensionY+5}`} stroke="#b2b2b2" strokeDasharray="4 4"/>
      {showReference&&<><path d={`M75,${floor0}H302`} stroke="#ababab" strokeDasharray="5 4"/>{beam(x0,floor0,true)}</>}
      <path d={`M75,${floor1}H302`} stroke="#5a5a5a"/>
      {beam(x1,floor1,false)}
      <path d={`M${ax-60/t},${gy-60}L${x1},${gy+(x1-ax)*t}`} stroke="#252525" strokeWidth="2.4"/>
      <path d={`M${ax-28},${gy}A28 28 0 0 1 ${ax-28*Math.cos(beta)},${gy-28*Math.sin(beta)}`} stroke="#6c6c6c"/>
    </g>
    <circle cx={ax} cy={gy} r="3.5" fill="#333333"/>
    {showReference&&<Dim x1={ax} x2={x0} y={gy+28} text={`X₀ ${format(r.x0)}`}/>}
    <Dim x1={ax} x2={x1} y={dimensionY} text={`X₁ ${format(r.x1)} m`} dark/>
    <VDim x={315} y1={gy+r.deltaX*terrain*scale} y2={floor1} text={`H₁ ${format(r.h1)} m`}/>
    {showReference&&<VDim x={346} y1={gy} y2={floor0} text={`H₀ ${format(r.h0)} m`}/>}
    <text x="18" y="312" className="mobile-annotation">X al borde de viga · H hasta el sello</text>
  </svg>;
}
export function Profile({ input, r, showReference, detail = false, compact = false }: { input: Inputs; r: Result; showReference: boolean; detail?: boolean; compact?: boolean }) {
  if(compact&&detail)return <MobileSection input={input} r={r} showReference={showReference}/>;
  // Schematic section: dimensions use the known X/H reference, not an inferred absolute bar insertion.
  const beta = r.beta * Math.PI/180;
  const t = Math.tan(beta), a = input.datum === 'terrain' ? Math.tan(r.alpha * Math.PI/180) : 0;
  const verticalShift = r.deltaX * t;
  const offset = r.h0 - r.x0 * t;
  const maxExtent = Math.max(r.h0, r.h0 + verticalShift, r.x0+1.3, r.x1+1.3, 3);
  const scale = Math.min(46, 165 / maxExtent);
  const ax = 610, gy = 219;
  const x0 = ax+r.x0*scale, x1 = ax+r.x1*scale;
  const floor0 = gy+r.h0*scale, floor1 = gy+(r.h0+verticalShift)*scale;
  const beamWidth = Math.max(14,scale); // Schematic 1 m radial width from the supplied drawings.
  const groundAtNew = gy+r.deltaX*a*scale;
  const barY = (x: number) => gy+(x-ax)*t;
  const beam = (x: number, y: number, ref: boolean) => <g className={ref ? 'ref-foundation' : 'foundation'}>
    <rect x={x} y={y-scale} width={beamWidth} height={scale} fill={ref ? 'none' : 'url(#concrete)'} />
    <path d={`M${x},${y-scale-12}V${y+8}`} strokeDasharray="5 4" />
  </g>;
  return <svg className={`technical-svg ${detail?'detail-svg':''} ${compact?'overview-svg':''}`} viewBox={detail?"470 50 530 415":compact?"0 0 515 465":"0 0 1000 465"} role="img" aria-label={`Perfil del tirante. X de proyecto ${format(r.x0)} metros; X ajustada ${format(r.x1)} metros; profundidad ${format(r.h1)} metros.`}>
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#dbdbdb" /></pattern>
      <pattern id="concrete" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#e6e6e6"/><path d="M0 9 9 0" stroke="#cccccc" strokeWidth=".65" /></pattern>
    </defs>
    <rect width="1000" height="465" fill="url(#grid)" />
    <g style={detail?{display:'none'}:undefined}><text className="svg-kicker" x="30" y="32">01 / SISTEMA DE TIRANTES</text>
    <text className="svg-kicker" x="555" y="32">02 / DETALLE DEL ANCLAJE</text>
    <path d="M515 55v342" stroke="#d6d6d6" strokeDasharray="3 6" />
    <g fill="none" stroke="#393939" strokeWidth="1.7">
      <path d="M137 286 151 65 170 286 M130 286h47 M145 155h30 M126 109h77 M136 76h59 M151 65v-22" />
      {[0,1,2,3,4].map(i => <path key={i} d={`M${140+i*2} ${273-i*34} 170 ${240-i*34} 143 ${210-i*34}`} strokeWidth=".8" />)}
      <path d="M126 109 72 283 M203 109 399 283" />
      <path d="M157 39v273" stroke="#9f9f9f" strokeDasharray="6 5" strokeWidth=".7" />
      <path d="M44 286h397" stroke="#7a7a7a" strokeWidth="1" />
      <rect x="139" y="286" width="34" height="20" fill="url(#concrete)" />
      <path d="M399 283v39h38 M411 295h25v27" stroke="#a2a2a2" />
      <path d="M203 109V286" stroke="#a8a8a8" strokeDasharray="4 4" strokeWidth=".8" />
    </g>
    <circle cx="203" cy="286" r="3" fill="#303030"/><circle cx="399" cy="283" r="3" fill="#303030"/>
    <text x="212" y="270" className="svg-label">P · E′ / F′</text>
    <text x="361" y="267" className="svg-label">Afloramiento</text>
    <text x="80" y="333" className="svg-muted">Eje del mástil</text>
    <Dim x1={203} x2={399} y={352} text={`C = ${format(r.c)} m · fijo`} dark />
    <text className="svg-muted" x="38" y="392">Vista general esquemática · sin escala</text>
    <text className="svg-muted" x="38" y="412">e = {format(r.pivot)} m desde el mástil a cada pivote</text>
    <text className="svg-muted" x="38" y="430">Ubicación del pivote: consultar vista en planta.</text></g>

    <g strokeWidth="1.2" fill="none">
      <path d={`M550,${gy}H${ax}L${ax+155},${gy+155*a}`} stroke="#929292" />
      <path d={`M${ax},${gy-10}V${Math.max(floor0,floor1)+40}`} stroke="#b8b8b8" strokeDasharray="4 4" />
      {showReference && <>
        <path d={`M${ax-12},${floor0}H930`} stroke="#b3b3b3" strokeDasharray="7 5" />
        {beam(x0,floor0,true)}
      </>}
      <path d={`M${ax-12},${floor1}H930`} stroke="#696969" />
      {beam(x1,floor1,false)}
      <path d={`M${ax-80/t},${gy-80}L${x1},${barY(x1)}`} stroke="#2a2a2a" strokeWidth="2.5" />
      <path d={`M${ax-43},${gy}A43 43 0 0 1 ${ax-43*Math.cos(beta)},${gy-43*Math.sin(beta)}`} stroke="#747474" />
    </g>
    <circle cx={ax} cy={gy} r="4" fill="#3a3a3a" />
    <text x={ax-120} y={gy-102} className="svg-label">β {angleLabel(input.beta)}</text>
    <text x={ax-30} y={gy-17} className="svg-label">C fijo</text>
    <text x="803" y={gy-34} className="svg-muted">Terreno α = {format(input.datum === 'terrain' ? r.alpha : 0,1)}°</text>
    <Dim x1={ax} x2={x1} y={Math.max(floor0,floor1)+26} text={`X₁ = ${format(r.x1)} m`} dark />
    {showReference && <Dim x1={ax} x2={x0} y={gy+19} text={`X₀ ${format(r.x0)}`} />}
    <VDim x={940} y1={groundAtNew} y2={floor1} text={`H₁ ${format(r.h1)} m`} />
    {showReference && <VDim x={976} y1={gy} y2={floor0} text={`H₀ ${format(r.h0)} m`} />}
    <text className="svg-muted" x="555" y="429">Viga de 1 m de alto · X al borde próximo al afloramiento</text>
    <text className="svg-muted" x="555" y="448">Anclaje esquemático; posición de barra según prefabricado.</text>
    {Math.abs(offset)>20 && <text x="555" y="72" className="svg-muted">Referencia fuera del rango habitual</text>}
  </svg>;
}

export function Plan({ input, r, compact = false }: { input: Inputs; r: Result; compact?: boolean }) {
  const p = r.plan;
  const extent = Math.max(...p.flatMap(q=>[Math.abs(q.x),Math.abs(q.y)]),1);
  const s = 158/extent, ox=360, oy=233;
  const selectedIndex=Number(input.guy)-1;
  const sx=selectedIndex<2?-1:1, sy=selectedIndex===1||selectedIndex===2?1:-1;
  const pivotY=oy-sy*r.pivot*s;
  return <><svg className={`technical-svg ${compact?'mobile-plan-svg':''}`} viewBox={compact?"75 48 570 380":"0 0 1000 465"} role="img" aria-label="Planta de replanteo con cuatro tirantes y pivotes E prima y F prima">
    <defs><pattern id="plan-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#dbdbdb" /></pattern></defs>
    <rect width="1000" height="465" fill="url(#plan-grid)" />
    <text className="svg-kicker" x="30" y="32">PLANTA / SISTEMA LOCAL DE TORRE</text>
    <g fill="none" stroke="#aaaaaa" strokeWidth=".8" strokeDasharray="7 5"><path d={`M80 ${oy}H620 M${ox} 55V420`} /></g>
    <text x="610" y={oy-10} className="svg-label">+X</text><text x={ox+10} y="60" className="svg-label">+Y</text>
    <rect x={ox-32} y={oy-10} width="64" height="20" fill="#e5e5e5" stroke="#3a3a3a" />
    <path d={`M${ox-105} ${oy-5}H${ox+105} M${ox-32} ${oy-10} ${ox} ${oy-r.pivot*s} ${ox+32} ${oy-10} M${ox-32} ${oy+10} ${ox} ${oy+r.pivot*s} ${ox+32} ${oy+10}`} stroke="#555555" fill="none" />
    {p.map((point,i)=>{
      const x=ox+point.x*s, y=oy-point.y*s, pivotY=oy+(i===1||i===2?-1:1)*r.pivot*s;
      const selected=String(i+1)===input.guy;
      return <g key={i} className={selected?'selected-guy':'other-guy'}>
        <path d={`M${ox},${pivotY}L${x},${y}`} fill="none" strokeWidth={selected?2.2:1} />
        <rect x="0" y="-9" width="10" height="18" transform={`translate(${x},${y}) rotate(${Math.atan2(y-pivotY,x-ox)*180/Math.PI})`} fill={selected?'#797979':'#e7e7e7'} />
        <circle cx={x} cy={y} r="2.6" /><text x={x+(point.x>0?17:-32)} y={y+4} className="svg-label">T{i+1}</text>
      </g>;
    })}
    <circle cx={ox} cy={oy-r.pivot*s} r="3" fill="#393939"/><circle cx={ox} cy={oy+r.pivot*s} r="3" fill="#393939"/>
    <text x={ox+10} y={oy-r.pivot*s-5} className="svg-label">E′</text><text x={ox+10} y={oy+r.pivot*s+16} className="svg-label">F′</text>
    <path d={`M${ox} ${pivotY}H${ox+sx*65}`} fill="none" stroke="#aaaaaa" strokeDasharray="4 4" />
    <path d={`M${ox+sx*42} ${pivotY}A42 42 0 0 ${sx===sy?0:1} ${ox+sx*42*Math.cos(r.phi*Math.PI/180)} ${pivotY-sy*42*Math.sin(r.phi*Math.PI/180)}`} fill="none" stroke="#808080" />
    <text x={ox+sx*58} y={pivotY-sy*18} className="svg-label">φ</text>
    <text x="690" y="100" className="svg-kicker">REPLANTEO · T{input.guy}</text>
    <text x="690" y="136" className="svg-label">φ = {angleLabel(input.phi)}</text>
    <text x="690" y="169" className="svg-label">P → borde: {format(r.distance)} m</text>
    <text x="690" y="247" className="svg-muted">Borde de viga · coordenadas locales</text>
    <text x="690" y="276" className="svg-label">X = {format(p[Number(input.guy)-1].x)} m</text>
    <text x="690" y="305" className="svg-label">Y = {format(p[Number(input.guy)-1].y)} m</text>
    <text x="690" y="348" className="svg-muted">Mástil → E′ = Mástil → F′ = {format(r.pivot)} m</text>
    <text x="690" y="374" className="svg-muted">E′ ↔ F′ = {format(r.pivot*2)} m</text>
    <text x="30" y="433" className="svg-muted">Planta simétrica ilustrativa · C y φ corresponden al tirante seleccionado. No sustituye el replanteo de los otros tirantes.</text>
  </svg>{compact&&<div className="mobile-plan-data"><div><span>φ · Replanteo T{input.guy}</span><strong>{angleLabel(input.phi)}</strong></div><div><span>e · Mástil → pivote</span><strong>{format(r.pivot)} m</strong></div><div><span>X local · borde</span><strong>{format(p[Number(input.guy)-1].x)} m</strong></div><div><span>Y local · borde</span><strong>{format(p[Number(input.guy)-1].y)} m</strong></div><p>Datos del tirante seleccionado · planta simétrica ilustrativa</p></div>}</>;
}
