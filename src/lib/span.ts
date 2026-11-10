import { format, number } from './geometry';

/**
 * Templado (flechado) de conductores con estación total desde un punto lateral al vano.
 * Todas las cotas son relativas al eje de muñones del instrumento, por eso la altura
 * instrumental no interviene. Ángulos internos en grados sexagesimales decimales.
 */
export type AngleUnit = 'gon' | 'deg' | 'dms';
export type DistanceKind = 'horizontal' | 'slope';
export type PhaseId = 'sup' | 'med' | 'inf' | 'gw';
export type Shot = { dist: string; v: string; hz: string };
export type PhaseData = { left: Shot; right: Shot; checkV: string };
export type SagRow = { t: string; sag: string };
export type SpanProject = {
  schema: 1; name: string; angleUnit: AngleUnit; distanceKind: DistanceKind;
  spanDesign: string; dropDesign: string; weight: string; breaking: string;
  table: SagRow[]; temp: string; creep: string; tolPct: string; tolMax: string;
  offsetLeft: string; offsetRight: string;
  selected: PhaseId; mode: 'set' | 'check'; phases: Record<PhaseId, PhaseData>;
};

export const PHASES: PhaseId[] = ['sup', 'med', 'inf', 'gw'];
export const PHASE_NAMES: Record<PhaseId, string> = { sup: 'Fase superior', med: 'Fase media', inf: 'Fase inferior', gw: 'Cable de guarda · OPGW' };
export const SPAN_STORAGE = 'rumbo3d-tirantes-vano-preview-v1';
const RAD = Math.PI / 180;
const emptyShot = (): Shot => ({ dist: '', v: '', hz: '' });
const emptyPhase = (): PhaseData => ({ left: { ...emptyShot(), hz: '0' }, right: emptyShot(), checkV: '' });

export function newSpan(): SpanProject {
  return { schema: 1, name: '', angleUnit: 'gon', distanceKind: 'horizontal', spanDesign: '', dropDesign: '', weight: '', breaking: '',
    table: [5, 10, 15, 20, 30, 40].map(t => ({ t: String(t), sag: '' })), temp: '20', creep: '0', tolPct: '2', tolMax: '0.25',
    offsetLeft: '0', offsetRight: '0', selected: 'sup', mode: 'set',
    phases: { sup: emptyPhase(), med: emptyPhase(), inf: emptyPhase(), gw: emptyPhase() } };
}

/** Caso de la planilla «Vano T.122 – T.124» (ángulos centesimales, distancias reducidas). */
export function exampleSpan(): SpanProject {
  const shot = (dl: string, vl: string, hz: string, dr: string, vr: string): PhaseData => ({ left: { dist: dl, v: vl, hz: '0' }, right: { dist: dr, v: vr, hz }, checkV: '' });
  return { ...newSpan(), name: 'T.122 – T.124', spanDesign: '139.464', dropDesign: '24.33', weight: '1.0349', breaking: '11067.65',
    table: [['5', '1.66'], ['10', '1.79'], ['15', '1.91'], ['20', '2.04'], ['30', '2.30'], ['40', '2.56']].map(([t, sag]) => ({ t, sag })),
    phases: {
      sup: shot('71.944', '77.3542', '169.2378', '70.713', '97.8680'),
      med: shot('71.488', '77.1804', '173.3648', '70.197', '97.8232'),
      inf: shot('70.974', '77.0728', '177.5326', '69.759', '97.8296'),
      gw: emptyPhase() } };
}

/** DMS en un solo campo: «77 21 15», «77°21'15"» o el pseudo-decimal de libreta GGG.MMSS. */
export function parseAngle(text: string, unit: AngleUnit): number {
  const raw = text.trim();
  if (unit !== 'dms') { const v = number(raw); return unit === 'gon' ? v * .9 : v; }
  const parts = raw.split(/[\s°'′"″:]+/).filter(Boolean);
  let d: number, m: number, s: number;
  if (parts.length > 1) { if (parts.length > 3) return NaN; [d, m = 0, s = 0] = parts.map(number); }
  else {
    const match = /^(\d+)(?:[.,](\d{2})(\d{2})?(\d*))?$/.exec(raw);
    if (!match) return NaN;
    d = Number(match[1]); m = Number(match[2] ?? 0); s = Number(`${match[3] ?? 0}.${match[4] || 0}`);
  }
  if (![d, m, s].every(Number.isFinite) || d < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return NaN;
  return d + m / 60 + s / 3600;
}
export function angleText(deg: number, unit: AngleUnit): string {
  if (!Number.isFinite(deg)) return '—';
  if (unit === 'gon') return `${format(deg / .9, 4)} gon`;
  if (unit === 'deg') return `${format(deg, 4)}°`;
  const total = Math.round(deg * 3600), sign = total < 0 ? '-' : '', abs = Math.abs(total);
  return `${sign}${Math.floor(abs / 3600)}° ${String(Math.floor(abs % 3600 / 60)).padStart(2, '0')}′ ${String(abs % 60).padStart(2, '0')}″`;
}
/** Diferencias angulares pequeñas: mgon o segundos. */
export function smallAngleText(deg: number, unit: AngleUnit): string {
  if (!Number.isFinite(deg)) return '—';
  return unit === 'gon' ? `${format(deg / .9 * 1000, 1)} mgon` : `${format(deg * 3600, 0)}″`;
}
export const unitSymbol = (unit: AngleUnit) => unit === 'gon' ? 'gon' : unit === 'deg' ? '°' : 'g.mmss';

type Point = { n: number; e: number; h: number; hd: number };
function point(shot: Shot, p: SpanProject, offset: number): Point | null {
  const d = number(shot.dist), z = parseAngle(shot.v, p.angleUnit), hz = parseAngle(shot.hz, p.angleUnit);
  if (![d, z, hz].every(Number.isFinite) || d <= 0 || z <= 0 || z >= 180) return null;
  // Con distancia inclinada se reduce al horizonte; con reducida la cota sale por tangente.
  const hd = p.distanceKind === 'slope' ? d * Math.sin(z * RAD) : d;
  const h = p.distanceKind === 'slope' ? d * Math.cos(z * RAD) : d / Math.tan(z * RAD);
  return { n: hd * Math.cos(hz * RAD), e: hd * Math.sin(hz * RAD), h: h + offset, hd };
}

export type SagTable = { valid: boolean; error?: string; rows: { t: number; sag: number }[] };
export function sagTable(p: SpanProject): SagTable {
  const rows = p.table.filter(r => r.t.trim() || r.sag.trim()).map(r => ({ t: number(r.t), sag: number(r.sag) }));
  if (rows.some(r => !Number.isFinite(r.t) || !Number.isFinite(r.sag) || r.sag <= 0)) return { valid: false, error: 'Revisa la tabla de templado: hay temperaturas o flechas sin completar.', rows: [] };
  if (rows.length < 2) return { valid: false, error: 'La tabla de templado necesita al menos dos temperaturas.', rows: [] };
  rows.sort((a, b) => a.t - b.t);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].t === rows[i - 1].t) return { valid: false, error: `La temperatura ${format(rows[i].t, 0)} °C está repetida en la tabla.`, rows: [] };
    if (rows[i].sag <= rows[i - 1].sag) return { valid: false, error: `La flecha debe crecer con la temperatura: revisa ${format(rows[i - 1].t, 0)} y ${format(rows[i].t, 0)} °C.`, rows: [] };
  }
  return { valid: true, rows };
}
/** Interpolación lineal por tramos. Fuera de tabla no se extrapola. */
export function sagAt(table: SagTable, t: number): number | null {
  const r = table.rows;
  if (!table.valid || !Number.isFinite(t) || t < r[0].t || t > r[r.length - 1].t) return null;
  const i = Math.max(1, r.findIndex(row => row.t >= t));
  return r[i - 1].sag + (r[i].sag - r[i - 1].sag) * (t - r[i - 1].t) / (r[i].t - r[i - 1].t);
}
/** Temperatura de tabla que produce esa flecha (inversa de sagAt). */
export function tempAt(table: SagTable, sag: number): number | null {
  const r = table.rows;
  if (!table.valid || !Number.isFinite(sag) || sag < r[0].sag || sag > r[r.length - 1].sag) return null;
  const i = Math.max(1, r.findIndex(row => row.sag >= sag));
  return r[i - 1].t + (r[i].t - r[i - 1].t) * (sag - r[i - 1].sag) / (r[i].sag - r[i - 1].sag);
}

export type PhaseGeometry = ReturnType<typeof phaseGeometry>;
export function phaseGeometry(p: SpanProject, id: PhaseId) {
  const data = p.phases[id], offL = number(p.offsetLeft || '0'), offR = number(p.offsetRight || '0');
  const L = point(data.left, p, Number.isFinite(offL) ? offL : 0), R = point(data.right, p, Number.isFinite(offR) ? offR : 0);
  const empty = { valid: false as const, hLeft: NaN, hRight: NaN, drop: NaN, span: NaN, chordMid: NaN, midDist: NaN, midHz: NaN, ratio: NaN, plan: null as null | { left: [number, number]; right: [number, number]; mid: [number, number] }, errors: [] as string[], warnings: [] as string[] };
  if (!L || !R) return { ...empty, errors: ['Faltan lecturas a las dos crucetas (distancia, vertical cenital y horizontal).'] };
  const span = Math.hypot(R.n - L.n, R.e - L.e);
  if (span < .5) return { ...empty, errors: ['Las dos crucetas coinciden: revisa el ángulo horizontal de la torre derecha.'] };
  const n = (L.n + R.n) / 2, e = (L.e + R.e) / 2, midDist = Math.hypot(n, e);
  const midHz = ((Math.atan2(e, n) / RAD) % 360 + 360) % 360;
  const design = number(p.spanDesign), dropDesign = number(p.dropDesign), drop = L.h - R.h, warnings: string[] = [];
  if (Number.isFinite(design) && design > 0 && Math.abs(span - design) / design > .015) warnings.push(`El vano medido difiere ${format(span - design, 2)} m del proyecto. Comprueba que la distancia sea ${p.distanceKind === 'slope' ? 'inclinada' : 'reducida (horizontal)'} y que el ángulo horizontal esté bien anotado.`);
  if (Number.isFinite(dropDesign) && Math.abs(Math.abs(drop) - Math.abs(dropDesign)) > .5) warnings.push(`El desnivel medido (${format(Math.abs(drop), 2)} m) difiere más de 0,50 m del de la tabla.`);
  if (midDist < 5) warnings.push('La estación está casi debajo del conductor: la visual al punto de flechado queda muy empinada. Aléjate del eje del vano.');
  return { valid: true as const, hLeft: L.h, hRight: R.h, drop, span, chordMid: (L.h + R.h) / 2, midDist, midHz, ratio: Number.isFinite(design) && design > 0 ? span / design : NaN,
    plan: { left: [L.n, L.e] as [number, number], right: [R.n, R.e] as [number, number], mid: [n, e] as [number, number] }, errors: [] as string[], warnings };
}

const tension = (p: SpanProject, span: number, sag: number) => { const w = number(p.weight); return Number.isFinite(w) && w > 0 && sag > 0 ? w * span * span / (8 * sag) : NaN; };
const zenith = (height: number, dist: number) => 90 - Math.atan2(height, dist) / RAD;
export const workTemp = (p: SpanProject) => number(p.temp) + (p.creep.trim() ? number(p.creep) : 0);

/** Ángulo cenital que debe quedar tangente al conductor en el punto medio del vano. */
export function sagTarget(p: SpanProject, id: PhaseId, temp = workTemp(p)) {
  const g = phaseGeometry(p, id), table = sagTable(p);
  const none = { valid: false as const, geometry: g, temp, sagTable: NaN, sag: NaN, zenith: NaN, tension: NaN, uts: NaN, perCm: NaN, error: '' };
  if (!g.valid) return { ...none, error: g.errors[0] };
  if (!table.valid) return { ...none, error: table.error! };
  if (!Number.isFinite(g.ratio)) return { ...none, error: 'Ingresa el vano de proyecto de la tabla de templado.' };
  const base = sagAt(table, temp);
  if (base === null) return { ...none, error: Number.isFinite(temp) ? `${format(temp, 1)} °C queda fuera de la tabla de templado (${format(table.rows[0].t, 0)} a ${format(table.rows[table.rows.length - 1].t, 0)} °C). No se extrapola.` : 'Ingresa la temperatura del conductor.' };
  // Parábola: f = w·a²/(8·H). A igual tensión la flecha escala con el cuadrado del vano.
  const sag = base * g.ratio * g.ratio, height = g.chordMid - sag, t = tension(p, g.span, sag), rupture = number(p.breaking);
  return { valid: true as const, geometry: g, temp, sagTable: base, sag, zenith: zenith(height, g.midDist), tension: t, uts: Number.isFinite(rupture) && rupture > 0 ? t / rupture : NaN,
    perCm: .01 * g.midDist / (g.midDist * g.midDist + height * height) / RAD, error: '' };
}

/** Flecha real a partir del cenital leído al conductor en la dirección del punto medio. */
export function sagCheck(p: SpanProject, id: PhaseId) {
  const target = sagTarget(p, id), g = target.geometry, z = parseAngle(p.phases[id].checkV, p.angleUnit);
  const none = { valid: false as const, target, sag: NaN, diff: NaN, pct: NaN, tolerance: NaN, ok: false, tempEq: null as number | null, tension: NaN, error: '' };
  if (!target.valid) return { ...none, error: target.error };
  if (!p.phases[id].checkV.trim()) return { ...none, error: 'Ingresa el cenital leído al conductor.' };
  if (!Number.isFinite(z) || z <= 0 || z >= 180) return { ...none, error: 'El cenital leído no es válido.' };
  const sag = g.chordMid - g.midDist / Math.tan(z * RAD);
  if (sag <= 0) return { ...none, error: 'La lectura queda por encima de la cuerda entre crucetas: revisa el ángulo o la dirección horizontal.' };
  const diff = sag - target.sag, pct = number(p.tolPct), max = number(p.tolMax);
  const limits = [Number.isFinite(pct) && pct > 0 ? target.sag * pct / 100 : Infinity, Number.isFinite(max) && max > 0 ? max : Infinity];
  const tolerance = Math.min(...limits), table = sagTable(p);
  return { valid: true as const, target, sag, diff, pct: diff / target.sag * 100, tolerance, ok: Math.abs(diff) <= tolerance,
    tempEq: tempAt(table, sag / (g.ratio * g.ratio)), tension: tension(p, g.span, sag), error: '' };
}

export function isSpan(value: unknown): value is SpanProject {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>, text = (x: unknown) => typeof x === 'string';
  const shot = (s: unknown) => !!s && typeof s === 'object' && ['dist', 'v', 'hz'].every(k => text((s as Record<string, unknown>)[k]));
  const phases = v.phases as Record<string, PhaseData> | undefined;
  return v.schema === 1 && ['name', 'spanDesign', 'dropDesign', 'weight', 'breaking', 'temp', 'creep', 'tolPct', 'tolMax', 'offsetLeft', 'offsetRight'].every(k => text(v[k]))
    && ['gon', 'deg', 'dms'].includes(v.angleUnit as string) && ['horizontal', 'slope'].includes(v.distanceKind as string)
    && PHASES.includes(v.selected as PhaseId) && ['set', 'check'].includes(v.mode as string)
    && Array.isArray(v.table) && v.table.length <= 40 && v.table.every(r => r && text(r.t) && text(r.sag))
    && !!phases && PHASES.every(id => phases[id] && shot(phases[id].left) && shot(phases[id].right) && text(phases[id].checkV));
}
