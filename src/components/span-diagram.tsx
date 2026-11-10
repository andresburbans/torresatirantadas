import { format } from '@/lib/geometry';
import { angleText, type AngleUnit, type PhaseGeometry } from '@/lib/span';

const W = 640, H = 300;

/** Perfil a lo largo del vano. Cotas respecto del eje del instrumento, vertical exagerada. */
export function SpanProfile({ g, sag }: { g: PhaseGeometry; sag: number }) {
  const low = Math.min(0, g.hLeft, g.hRight, g.chordMid - sag) - 2, high = Math.max(g.hLeft, g.hRight) + 2;
  const x = (t: number) => 60 + t * (W - 120), y = (h: number) => 34 + (high - h) / (high - low) * (H - 80);
  const cable = (t: number) => g.hLeft + t * (g.hRight - g.hLeft) - 4 * sag * t * (1 - t);
  const path = Array.from({ length: 41 }, (_, i) => `${i ? 'L' : 'M'}${x(i / 40).toFixed(1)} ${y(cable(i / 40)).toFixed(1)}`).join(' ');
  const mid = x(.5), top = y(g.chordMid), bottom = y(g.chordMid - sag);
  return <svg className="span-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Perfil del vano con la flecha en el punto medio">
    <line x1={30} x2={W - 30} y1={y(0)} y2={y(0)} stroke="#b5b5b5" strokeDasharray="2 5" />
    <text x={34} y={y(0) - 6} className="svg-muted">Horizonte del instrumento</text>
    {[0, 1].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1={y(t ? g.hRight : g.hLeft)} y2={H - 30} stroke="#555" strokeWidth={3} />
      <line x1={x(t) - 16} x2={x(t) + 16} y1={y(t ? g.hRight : g.hLeft)} y2={y(t ? g.hRight : g.hLeft)} stroke="#555" strokeWidth={3} />
      <text x={x(t)} y={H - 12} textAnchor="middle">{t ? 'Torre derecha' : 'Torre izquierda'}</text>
      <text x={x(t) + (t ? 8 : -8)} y={y(t ? g.hRight : g.hLeft) + 18} textAnchor={t ? 'start' : 'end'} className="svg-muted">{format(t ? g.hRight : g.hLeft, 2)} m</text></g>)}
    <line x1={x(0)} y1={y(g.hLeft)} x2={x(1)} y2={y(g.hRight)} stroke="#999" strokeDasharray="6 4" />
    <path d={path} fill="none" stroke="#222" strokeWidth={1.8} />
    <line x1={mid} x2={mid} y1={top} y2={bottom} stroke="#222" />
    <circle cx={mid} cy={bottom} r={4.5} fill="#fff" stroke="#222" strokeWidth={1.5} />
    <text x={mid + 8} y={top - 8}>f = {format(sag)} m</text>
    <text x={mid - 10} y={bottom + 18} textAnchor="end" className="svg-muted">Punto de flechado</text>
    <text x={mid} y={22} textAnchor="middle" className="svg-muted">Vano {format(g.span)} m · desnivel {format(Math.abs(g.drop), 2)} m</text>
  </svg>;
}

/** Planta con la estación en el origen y el cero del círculo hacia arriba. */
export function SpanPlan({ g, unit }: { g: PhaseGeometry; unit: AngleUnit }) {
  if (!g.plan) return null;
  const pts = [[0, 0], g.plan.left, g.plan.right] as [number, number][];
  const minE = Math.min(...pts.map(p => p[1])), maxE = Math.max(...pts.map(p => p[1])), minN = Math.min(...pts.map(p => p[0])), maxN = Math.max(...pts.map(p => p[0]));
  const k = Math.min((W - 150) / Math.max(maxE - minE, 1), (H - 90) / Math.max(maxN - minN, 1));
  const px = ([n, e]: [number, number]) => [W / 2 + (e - (minE + maxE) / 2) * k, H / 2 - (n - (minN + maxN) / 2) * k] as const;
  const [sx, sy] = px([0, 0]), [lx, ly] = px(g.plan.left), [rx, ry] = px(g.plan.right), [mx, my] = px(g.plan.mid);
  return <svg className="span-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Planta: estación, crucetas y punto medio del vano">
    <line x1={lx} y1={ly} x2={rx} y2={ry} stroke="#222" strokeWidth={1.8} />
    <line x1={sx} y1={sy} x2={lx} y2={ly} stroke="#aaa" strokeDasharray="5 4" /><line x1={sx} y1={sy} x2={rx} y2={ry} stroke="#aaa" strokeDasharray="5 4" />
    <line x1={sx} y1={sy} x2={mx} y2={my} stroke="#222" />
    {[[lx, ly, 'Cruceta izquierda'], [rx, ry, 'Cruceta derecha']].map(([cx, cy, label]) => <g key={label}><rect x={Number(cx) - 5} y={Number(cy) - 5} width={10} height={10} fill="#555" /><text x={Number(cx)} y={Number(cy) + (Number(cy) < sy ? -12 : 22)} textAnchor="middle">{label}</text></g>)}
    <circle cx={mx} cy={my} r={4.5} fill="#fff" stroke="#222" strokeWidth={1.5} />
    <text x={mx + 10} y={my + (my < sy ? -8 : 16)} className="svg-muted">Punto medio · Hz {angleText(g.midHz, unit)}</text>
    <path d={`M${sx} ${sy - 9}L${sx + 8} ${sy + 6}H${sx - 8}Z`} fill="#fff" stroke="#222" strokeWidth={1.5} />
    <text x={sx + (mx >= sx ? -14 : 14)} y={sy + 5} textAnchor={mx >= sx ? 'end' : 'start'}>Estación · {format(g.midDist, 2)} m</text>
  </svg>;
}
