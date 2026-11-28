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
/** offLeft/offRight: Δ vertical del punto visado al apoyo real del conductor (cadena, polea, mancal). */
export type PhaseData = { left: Shot; right: Shot; checkV: string; offLeft: string; offRight: string };
export type SagRow = { t: string; sag: string };
/** Cable de guarda / OPGW: otro peso y otra tabla que los conductores de fase. */
export type GuardCable = { weight: string; breaking: string; table: SagRow[] };
/** Lectura de verificación guardada: se congela con los valores del momento. */
export type LogEntry = { at: string; phase: PhaseId; temp: number; reading: string; unit: AngleUnit; sag: number; target: number; diff: number; tolerance: number; ok: boolean; span: number };
export type SpanProject = {
  schema: 2; id: string; name: string; angleUnit: AngleUnit; distanceKind: DistanceKind;
  spanDesign: string; tableSpan: string; dropDesign: string; weight: string; breaking: string;
  table: SagRow[]; gw: GuardCable; temp: string; creep: string; tolPct: string; tolMax: string;
  selected: PhaseId; mode: 'set' | 'check'; phases: Record<PhaseId, PhaseData>; log: LogEntry[];
};
export type SpanStore = { current: string; spans: SpanProject[] };

export const PHASES: PhaseId[] = ['sup', 'med', 'inf', 'gw'];
export const PHASE_NAMES: Record<PhaseId, string> = { sup: 'Fase superior', med: 'Fase media', inf: 'Fase inferior', gw: 'Cable de guarda · OPGW' };
export const PHASE_SHORT: Record<PhaseId, string> = { sup: 'Superior', med: 'Media', inf: 'Inferior', gw: 'Guarda' };
/** Esquema 1 (v2.3.x): un solo vano. Se lee una vez y se migra al almacén de vanos. */
export const SPAN_STORAGE_V1 = 'rumbo3d-tirantes-vano-preview-v1';
export const SPAN_STORAGE = 'rumbo3d-tirantes-vanos-v2';
export const MAX_SPANS = 60, MAX_LOG = 200;
const RAD = Math.PI / 180;
const emptyShot = (): Shot => ({ dist: '', v: '', hz: '' });
const emptyPhase = (): PhaseData => ({ left: { ...emptyShot(), hz: '0' }, right: emptyShot(), checkV: '', offLeft: '0', offRight: '0' });
const emptyTable = () => [5, 10, 15, 20, 30, 40].map(t => ({ t: String(t), sag: '' }));
export const newId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function newSpan(): SpanProject {
  return { schema: 2, id: newId(), name: '', angleUnit: 'gon', distanceKind: 'horizontal', spanDesign: '', tableSpan: '', dropDesign: '', weight: '', breaking: '',
    table: emptyTable(), gw: { weight: '', breaking: '', table: emptyTable() }, temp: '20', creep: '0', tolPct: '2', tolMax: '0.25',
    selected: 'sup', mode: 'set', phases: { sup: emptyPhase(), med: emptyPhase(), inf: emptyPhase(), gw: emptyPhase() }, log: [] };
}

/** Siguiente vano del mismo cantón: conserva conductor, tabla, unidades y tolerancias; vacía lecturas y registro. */
export function nextSpan(p: SpanProject): SpanProject {
  const base = newSpan();
  return { ...p, id: base.id, name: '', spanDesign: '', dropDesign: '', tableSpan: p.tableSpan.trim() ? p.tableSpan : p.spanDesign,
    phases: Object.fromEntries(PHASES.map(id => [id, { ...emptyPhase(), offLeft: p.phases[id].offLeft, offRight: p.phases[id].offRight }])) as Record<PhaseId, PhaseData>,
    log: [], selected: 'sup', mode: 'set' };
}

/** Caso de la planilla «Vano T.122 – T.124» (ángulos centesimales, distancias reducidas). */
export function exampleSpan(): SpanProject {
  const shot = (dl: string, vl: string, hz: string, dr: string, vr: string): PhaseData => ({ ...emptyPhase(), left: { dist: dl, v: vl, hz: '0' }, right: { dist: dr, v: vr, hz } });
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
/** Texto de entrada en la unidad indicada (lo que se teclearía en el campo). */
export function angleInput(deg: number, unit: AngleUnit): string {
  if (!Number.isFinite(deg)) return '';
  if (unit === 'gon') return (deg / .9).toFixed(4);
  if (unit === 'deg') return deg.toFixed(5);
  const tenths = Math.round(Math.abs(deg) * 36000), d = Math.floor(tenths / 36000), m = Math.floor(tenths % 36000 / 600), s = tenths % 600;
  return `${d}.${String(m).padStart(2, '0')}${String(Math.floor(s / 10)).padStart(2, '0')}${s % 10 ? s % 10 : ''}`;
}
/** Al cambiar la unidad se convierten las lecturas ya anotadas; las incompletas se dejan como están. */
export function convertAngles(p: SpanProject, unit: AngleUnit): SpanProject {
  if (unit === p.angleUnit) return p;
  const conv = (text: string) => { const deg = parseAngle(text, p.angleUnit); return text.trim() && Number.isFinite(deg) ? angleInput(deg, unit) : text; };
  const shot = (s: Shot): Shot => ({ dist: s.dist, v: conv(s.v), hz: conv(s.hz) });
  return { ...p, angleUnit: unit, phases: Object.fromEntries(PHASES.map(id => { const ph = p.phases[id]; return [id, { ...ph, left: shot(ph.left), right: shot(ph.right), checkV: conv(ph.checkV) }]; })) as Record<PhaseId, PhaseData> };
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
/** Lectura a una cruceta. Devuelve el punto o el motivo concreto por el que no se puede usar. */
function point(shot: Shot, p: SpanProject, offset: number): Point | string {
  if (!shot.dist.trim() || !shot.v.trim() || !shot.hz.trim()) return 'faltan datos';
  const d = number(shot.dist), z = parseAngle(shot.v, p.angleUnit), hz = parseAngle(shot.hz, p.angleUnit);
  if (!Number.isFinite(d) || d <= 0) return 'distancia no válida';
  if (!Number.isFinite(z) || z <= 0) return 'cenital no válido';
  if (z >= 180) return 'cenital en círculo II: anota la lectura en círculo I (cenital menor de 200 gon / 180°)';
  if (!Number.isFinite(hz)) return 'horizontal no válido';
  // Con distancia inclinada se reduce al horizonte; con reducida la cota sale por tangente.
  const hd = p.distanceKind === 'slope' ? d * Math.sin(z * RAD) : d;
  const h = p.distanceKind === 'slope' ? d * Math.cos(z * RAD) : d / Math.tan(z * RAD);
  return { n: hd * Math.cos(hz * RAD), e: hd * Math.sin(hz * RAD), h: h + offset, hd };
}

/** Peso, rotura y tabla del cable de la fase indicada. */
export function cableFor(p: SpanProject, id: PhaseId) { return id === 'gw' ? p.gw : { weight: p.weight, breaking: p.breaking, table: p.table }; }

export type SagTable = { valid: boolean; error?: string; rows: { t: number; sag: number }[] };
export function sagTable(source: Pick<SpanProject, 'table'>, label = 'la tabla de templado'): SagTable {
  const rows = source.table.filter(r => r.t.trim() || r.sag.trim()).map(r => ({ t: number(r.t), sag: number(r.sag) }));
  if (rows.some(r => !Number.isFinite(r.t) || !Number.isFinite(r.sag) || r.sag <= 0)) return { valid: false, error: `Revisa ${label}: hay temperaturas o flechas sin completar.`, rows: [] };
  if (rows.length < 2) return { valid: false, error: `Completa ${label}: necesita al menos dos temperaturas con su flecha.`, rows: [] };
  rows.sort((a, b) => a.t - b.t);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].t === rows[i - 1].t) return { valid: false, error: `La temperatura ${format(rows[i].t, 0)} °C está repetida en ${label}.`, rows: [] };
    if (rows[i].sag <= rows[i - 1].sag) return { valid: false, error: `En ${label} la flecha debe crecer con la temperatura: revisa ${format(rows[i - 1].t, 0)} y ${format(rows[i].t, 0)} °C.`, rows: [] };
  }
  return { valid: true, rows };
}
export const tableFor = (p: SpanProject, id: PhaseId) => sagTable(cableFor(p, id), id === 'gw' ? 'la tabla del cable de guarda' : 'la tabla de templado');
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
/** Vano para el que está calculada la tabla: el regulador del cantón o, si no se indica, el de proyecto. */
export const tableSpanOf = (p: SpanProject) => number(p.tableSpan.trim() ? p.tableSpan : p.spanDesign);

export type PhaseGeometry = ReturnType<typeof phaseGeometry>;
export function phaseGeometry(p: SpanProject, id: PhaseId) {
  const data = p.phases[id], offL = number(data.offLeft.trim() || '0'), offR = number(data.offRight.trim() || '0');
  const L = point(data.left, p, Number.isFinite(offL) ? offL : 0), R = point(data.right, p, Number.isFinite(offR) ? offR : 0);
  const empty = { valid: false as const, hLeft: NaN, hRight: NaN, drop: NaN, span: NaN, chordMid: NaN, midDist: NaN, midHz: NaN, ratio: NaN, cosSlope: NaN, plan: null as null | { left: [number, number]; right: [number, number]; mid: [number, number] }, errors: [] as string[], warnings: [] as string[] };
  if (typeof L === 'string' || typeof R === 'string') {
    if (L === 'faltan datos' && R === 'faltan datos') return { ...empty, errors: [`${PHASE_NAMES[id]}: faltan las lecturas a las dos crucetas (distancia, cenital y horizontal).`] };
    const parts = [typeof L === 'string' ? `torre izquierda, ${L}` : '', typeof R === 'string' ? `torre derecha, ${R}` : ''].filter(Boolean).join('; ');
    return { ...empty, errors: [`${PHASE_NAMES[id]} · ${parts}.`] };
  }
  const span = Math.hypot(R.n - L.n, R.e - L.e);
  if (span < .5) return { ...empty, errors: ['Las dos crucetas coinciden: revisa el ángulo horizontal de la torre derecha.'] };
  const n = (L.n + R.n) / 2, e = (L.e + R.e) / 2, midDist = Math.hypot(n, e);
  const midHz = ((Math.atan2(e, n) / RAD) % 360 + 360) % 360;
  const design = number(p.spanDesign), ruling = tableSpanOf(p), dropDesign = number(p.dropDesign), drop = L.h - R.h, warnings: string[] = [];
  if (Number.isFinite(design) && design > 0 && Math.abs(span - design) / design > .015) warnings.push(`El vano medido difiere ${format(span - design, 2)} m del proyecto. Comprueba que la distancia sea ${p.distanceKind === 'slope' ? 'inclinada' : 'reducida (horizontal)'} y que el ángulo horizontal esté bien anotado.`);
  if (Number.isFinite(dropDesign) && Math.abs(Math.abs(drop) - Math.abs(dropDesign)) > .5) warnings.push(`El desnivel medido (${format(Math.abs(drop), 2)} m) difiere más de 0,50 m del de proyecto (${format(Math.abs(dropDesign), 2)} m). Revisa el Δ vertical de cadena o polea de esta fase.`);
  if (midDist < 5) warnings.push('La estación está casi debajo del conductor: la visual al punto de flechado queda muy empinada. Aléjate del eje del vano.');
  return { valid: true as const, hLeft: L.h, hRight: R.h, drop, span, chordMid: (L.h + R.h) / 2, midDist, midHz, ratio: Number.isFinite(ruling) && ruling > 0 ? span / ruling : NaN,
    cosSlope: span / Math.hypot(span, drop),
    plan: { left: [L.n, L.e] as [number, number], right: [R.n, R.e] as [number, number], mid: [n, e] as [number, number] }, errors: [] as string[], warnings };
}

/** Tensión horizontal de la parábola en vano inclinado: H = w·a² / (8·f·cos ψ). */
function tension(p: SpanProject, id: PhaseId, g: { span: number; cosSlope: number }, sag: number) {
  const w = number(cableFor(p, id).weight);
  return Number.isFinite(w) && w > 0 && sag > 0 ? w * g.span * g.span / (8 * sag * g.cosSlope) : NaN;
}
const zenith = (height: number, dist: number) => 90 - Math.atan2(height, dist) / RAD;
export const workTemp = (p: SpanProject) => number(p.temp) + (p.creep.trim() ? number(p.creep) : 0);

/** Ángulo cenital que debe quedar en el conductor en el punto medio del vano. */
export function sagTarget(p: SpanProject, id: PhaseId, temp = workTemp(p)) {
  const g = phaseGeometry(p, id), table = tableFor(p, id);
  const none = { valid: false as const, geometry: g, temp, sagTable: NaN, sag: NaN, zenith: NaN, tension: NaN, uts: NaN, perCm: NaN, error: '' };
  if (!g.valid) return { ...none, error: g.errors[0] };
  if (!table.valid) return { ...none, error: table.error! };
  if (!Number.isFinite(g.ratio)) return { ...none, error: 'Ingresa el vano de proyecto (o el vano de la tabla) en Ajustes → Proyecto.' };
  const base = sagAt(table, temp);
  if (base === null) return { ...none, error: Number.isFinite(temp) ? `${format(temp, 1)} °C queda fuera de ${id === 'gw' ? 'la tabla del cable de guarda' : 'la tabla de templado'} (${format(table.rows[0].t, 0)} a ${format(table.rows[table.rows.length - 1].t, 0)} °C). No se extrapola.` : 'Ingresa la temperatura del conductor.' };
  // Parábola: f = w·a²/(8·H). A igual tensión la flecha escala con el cuadrado del vano.
  const sag = base * g.ratio * g.ratio, height = g.chordMid - sag, t = tension(p, id, g, sag), rupture = number(cableFor(p, id).breaking);
  return { valid: true as const, geometry: g, temp, sagTable: base, sag, zenith: zenith(height, g.midDist), tension: t, uts: Number.isFinite(rupture) && rupture > 0 ? t / rupture : NaN,
    perCm: .01 * g.midDist / (g.midDist * g.midDist + height * height) / RAD, error: '' };
}

/** Flecha real a partir del cenital leído al conductor en la dirección del punto medio. */
export function sagCheck(p: SpanProject, id: PhaseId) {
  const target = sagTarget(p, id), g = target.geometry, z = parseAngle(p.phases[id].checkV, p.angleUnit);
  const none = { valid: false as const, target, sag: NaN, diff: NaN, pct: NaN, tolerance: NaN, ok: false, tempEq: null as number | null, tension: NaN, error: '' };
  if (!target.valid) return { ...none, error: target.error };
  if (!p.phases[id].checkV.trim()) return { ...none, error: 'Ingresa el cenital leído al conductor.' };
  if (!Number.isFinite(z) || z <= 0 || z >= 180) return { ...none, error: z >= 180 ? 'Cenital en círculo II: anota la lectura en círculo I.' : 'El cenital leído no es válido.' };
  const sag = g.chordMid - g.midDist / Math.tan(z * RAD);
  if (sag <= 0) return { ...none, error: 'La lectura queda por encima de la cuerda entre crucetas: revisa el ángulo o la dirección horizontal.' };
  const diff = sag - target.sag, pct = number(p.tolPct), max = number(p.tolMax);
  const limits = [Number.isFinite(pct) && pct > 0 ? target.sag * pct / 100 : Infinity, Number.isFinite(max) && max > 0 ? max : Infinity];
  const tolerance = Math.min(...limits), table = tableFor(p, id);
  return { valid: true as const, target, sag, diff, pct: diff / target.sag * 100, tolerance, ok: Math.abs(diff) <= tolerance,
    tempEq: tempAt(table, sag / (g.ratio * g.ratio)), tension: tension(p, id, g, sag), error: '' };
}

/** Congela la verificación actual del conductor seleccionado en el registro del vano. */
export function logCheck(p: SpanProject, at = new Date()): SpanProject | null {
  const c = sagCheck(p, p.selected);
  if (!c.valid) return null;
  const entry: LogEntry = { at: at.toISOString(), phase: p.selected, temp: c.target.temp, reading: p.phases[p.selected].checkV.trim(), unit: p.angleUnit,
    sag: c.sag, target: c.target.sag, diff: c.diff, tolerance: c.tolerance, ok: c.ok, span: c.target.geometry.span };
  return { ...p, log: [entry, ...p.log].slice(0, MAX_LOG) };
}
/** CSV para Excel en español: punto y coma, coma decimal. */
export function logCsv(spans: SpanProject[]): string {
  const n = (v: number, d: number) => Number.isFinite(v) ? v.toFixed(d).replace('.', ',') : '';
  const q = (v: string) => /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const pad = (v: number) => String(v).padStart(2, '0');
  const head = 'Fecha;Hora;Vano;Conductor;Temperatura °C;Cenital leído;Unidad;Vano medido m;Flecha real m;Flecha objetivo m;Diferencia cm;Tolerancia cm;Resultado';
  const rows = spans.flatMap(s => s.log.map(e => {
    const d = new Date(e.at);
    return [`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, `${pad(d.getHours())}:${pad(d.getMinutes())}`, q(s.name || 'Sin nombre'), PHASE_SHORT[e.phase], n(e.temp, 1), q(e.reading), unitSymbol(e.unit),
      n(e.span, 3), n(e.sag, 3), n(e.target, 3), n(e.diff * 100, 1), n(e.tolerance * 100, 1), e.ok ? 'Cumple' : 'No cumple'].join(';');
  }));
  return [head, ...rows].join('\r\n') + '\r\n';
}

const text = (x: unknown): x is string => typeof x === 'string';
const isShot = (s: unknown) => !!s && typeof s === 'object' && ['dist', 'v', 'hz'].every(k => text((s as Record<string, unknown>)[k]));
const isTable = (t: unknown): t is SagRow[] => Array.isArray(t) && t.length <= 40 && t.every(r => r && text(r.t) && text(r.sag));
const isEntry = (e: unknown): e is LogEntry => { const v = e as Record<string, unknown>; return !!v && typeof v === 'object' && text(v.at) && PHASES.includes(v.phase as PhaseId) && text(v.reading) && ['gon', 'deg', 'dms'].includes(v.unit as string) && typeof v.ok === 'boolean' && ['temp', 'sag', 'target', 'diff', 'tolerance', 'span'].every(k => typeof v[k] === 'number'); };

/** Lee un vano de esquema 2 o migra uno de esquema 1 (Δ vertical común, una sola tabla). Devuelve null si no es válido. */
export function readSpan(value: unknown): SpanProject | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>, phases = v.phases as Record<string, Record<string, unknown>> | undefined;
  const common = ['name', 'spanDesign', 'dropDesign', 'weight', 'breaking', 'temp', 'creep', 'tolPct', 'tolMax'].every(k => text(v[k]))
    && ['gon', 'deg', 'dms'].includes(v.angleUnit as string) && ['horizontal', 'slope'].includes(v.distanceKind as string)
    && PHASES.includes(v.selected as PhaseId) && ['set', 'check'].includes(v.mode as string) && isTable(v.table)
    && !!phases && PHASES.every(id => phases[id] && isShot(phases[id].left) && isShot(phases[id].right) && text(phases[id].checkV));
  if (!common) return null;
  const pick = (ph: Record<string, unknown>, offL: string, offR: string): PhaseData => ({ left: { ...(ph.left as Shot) }, right: { ...(ph.right as Shot) }, checkV: ph.checkV as string, offLeft: offL, offRight: offR });
  const base = { name: v.name, angleUnit: v.angleUnit, distanceKind: v.distanceKind, spanDesign: v.spanDesign, dropDesign: v.dropDesign, weight: v.weight, breaking: v.breaking,
    table: (v.table as SagRow[]).map(r => ({ t: r.t, sag: r.sag })), temp: v.temp, creep: v.creep, tolPct: v.tolPct, tolMax: v.tolMax, selected: v.selected, mode: v.mode } as Omit<SpanProject, 'schema' | 'id' | 'tableSpan' | 'gw' | 'phases' | 'log'>;
  if (v.schema === 1) {
    if (!text(v.offsetLeft) || !text(v.offsetRight)) return null;
    // El Δ vertical era común a las cuatro fases: se copia a todas para no cambiar resultados ya calculados.
    return { ...base, schema: 2, id: newId(), tableSpan: '', gw: newSpan().gw, log: [],
      phases: Object.fromEntries(PHASES.map(id => [id, pick(phases![id], v.offsetLeft as string, v.offsetRight as string)])) as Record<PhaseId, PhaseData> };
  }
  const gw = v.gw as Record<string, unknown> | undefined;
  if (v.schema !== 2 || !text(v.id) || !v.id || !text(v.tableSpan) || !gw || !text(gw.weight) || !text(gw.breaking) || !isTable(gw.table) || !Array.isArray(v.log)
    || !PHASES.every(id => text(phases![id].offLeft) && text(phases![id].offRight))) return null;
  return { ...base, schema: 2, id: v.id, tableSpan: v.tableSpan, gw: { weight: gw.weight, breaking: gw.breaking, table: gw.table.map(r => ({ t: r.t, sag: r.sag })) },
    log: v.log.filter(isEntry).slice(0, MAX_LOG),
    phases: Object.fromEntries(PHASES.map(id => [id, pick(phases![id], phases![id].offLeft as string, phases![id].offRight as string)])) as Record<PhaseId, PhaseData> };
}

/** Almacén de vanos del dispositivo. Acepta también el vano único de esquema 1. */
export function readStore(value: unknown): SpanStore | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (Array.isArray(v.spans)) {
    const spans = v.spans.map(readSpan).filter((s): s is SpanProject => !!s).slice(0, MAX_SPANS);
    const seen = new Set<string>();
    for (const s of spans) { if (seen.has(s.id)) s.id = newId(); seen.add(s.id); }
    if (!spans.length) return null;
    return { spans, current: spans.some(s => s.id === v.current) ? v.current as string : spans[0].id };
  }
  const single = readSpan(value);
  return single ? { spans: [single], current: single.id } : null;
}
export function storeOf(p: SpanProject): SpanStore { return { spans: [p], current: p.id }; }
export const currentSpan = (s: SpanStore) => s.spans.find(x => x.id === s.current) ?? s.spans[0];
export function updateCurrent(s: SpanStore, fn: (p: SpanProject) => SpanProject): SpanStore {
  const cur = currentSpan(s);
  return { ...s, spans: s.spans.map(x => x.id === cur.id ? fn(x) : x) };
}
export function addSpan(s: SpanStore, p: SpanProject): SpanStore { return { current: p.id, spans: [...s.spans, p].slice(-MAX_SPANS) }; }
export function removeSpan(s: SpanStore, id: string): SpanStore {
  const spans = s.spans.filter(x => x.id !== id);
  if (!spans.length) { const fresh = newSpan(); return { spans: [fresh], current: fresh.id }; }
  return { spans, current: s.current === id ? spans[Math.max(0, s.spans.findIndex(x => x.id === id) - 1)].id : s.current };
}
