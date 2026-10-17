export type DMS = { deg: string; min: string; sec: string };
export type Inputs = {
  tower: 'GI6KL' | 'G6KL' | 'GR6KL'; soil: '3' | '4'; alpha: string;
  pivot: string; c: string; x0: string; h0: string; target: string;
  beta: DMS; phi: DMS; datum: 'fixed' | 'terrain'; mode: 'depth' | 'x' | 'seal';
  groundElevation: string; id: string; guy: string;
};
export const DEFAULTS: Inputs = {
  tower: 'GI6KL', soil: '3', alpha: '5', pivot: '3.3', c: '26.219',
  x0: '2.117', h0: '3.5', target: '4', beta: { deg: '57', min: '7', sec: '1' },
  phi: { deg: '35', min: '27', sec: '0' }, datum: 'terrain', mode: 'depth',
  groundElevation: '', id: 'T574', guy: '1',
};
export function number(value: string): number {
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value.trim())) return NaN;
  return Number(value.trim().replace(',', '.'));
}
export function dms(value: DMS): number {
  const d = number(value.deg), m = number(value.min), s = number(value.sec);
  if (![d,m,s].every(Number.isFinite) || d < 0 || m < 0 || m >= 60 || s < 0 || s >= 60) return NaN;
  return d + m / 60 + s / 3600;
}
export function toDms(value: number): DMS {
  const total = Math.round(value * 3600 * 100) / 100;
  return { deg: String(Math.floor(total / 3600)), min: String(Math.floor(total % 3600 / 60)), sec: String(Math.round(total % 60 * 100) / 100) };
}
export const format = (n: number, digits = 3) => Number.isFinite(n) ? n.toLocaleString('es-CL', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }) : '—';
export const angleLabel = (v: DMS) => `${v.deg}° ${v.min}′ ${v.sec}″`;
export function calculate(input: Inputs) {
  const c = number(input.c), x0 = number(input.x0), h0 = number(input.h0), target = number(input.target);
  const pivot = number(input.pivot), beta = dms(input.beta), phi = dms(input.phi), alpha = number(input.alpha);
  const errors: string[] = [];
  if (![c, x0, h0, target, pivot, alpha].every(Number.isFinite)) errors.push('Completa las distancias con números válidos. Puedes usar coma o punto decimal.');
  if (!(c > 0 && x0 >= 0 && h0 > 0 && pivot >= 0)) errors.push('C y H₀ deben ser mayores que cero; X₀ y e no pueden ser negativos.');
  if (!(beta > 0 && beta < 90)) errors.push('β debe estar entre 0° y 90°, sin incluir los extremos. Minutos y segundos: de 0 a menos de 60.');
  if (!(phi >= 0 && phi < 90)) errors.push('φ debe estar entre 0° y menos de 90°, con minutos y segundos válidos.');
  if (!(alpha >= -30 && alpha <= 30)) errors.push('α debe estar entre −30° y 30°.');
  const rad = Math.PI / 180;
  const slope = Math.tan(beta * rad) - (input.datum === 'terrain' ? Math.tan(alpha * rad) : 0);
  if (!(slope > 0.01)) errors.push('La dirección del tirante debe ser más inclinada que el terreno (β > α).');
  const elevation = input.groundElevation.trim() === '' ? null : number(input.groundElevation);
  if (input.mode === 'seal' && elevation === null) errors.push('Para calcular desde una cota de sello, ingresa Zt₀, la cota de terreno de referencia.');
  const sealDeltaX = elevation === null ? NaN : ((elevation - h0) - target) / Math.tan(beta * rad);
  const h1 = input.mode === 'depth' ? target : h0 + (input.mode === 'seal' ? sealDeltaX : target - x0) * slope;
  const x1 = input.mode === 'x' ? target : x0 + (input.mode === 'seal' ? sealDeltaX : (target - h0) / slope);
  if (!(h1 > 0)) errors.push('La profundidad resultante debe ser mayor que cero.');
  if (!(x1 >= 0)) errors.push('La X resultante queda antes del afloramiento. Revisa el objetivo y la referencia.');
  if (elevation !== null && !Number.isFinite(elevation)) errors.push('La cota de terreno debe ser un número válido o dejarse vacía.');
  const deltaX = x1 - x0, deltaH = h1 - h0, distance = c + x1;
  const groundShift = input.datum === 'terrain' ? -deltaX * Math.tan(alpha * rad) : 0;
  return {
    errors, valid: errors.length === 0, c, x0, x1, h0, h1, pivot, beta, phi, alpha, slope,
    deltaX, deltaH, distance,
    seal0: elevation === null ? null : elevation - h0,
    seal1: elevation === null ? null : elevation + groundShift - h1,
    // Local X transversal, Y longitudinal. φ measured from ±X. Pivot at ±Y.
    plan: [ [-1,-1], [-1,1], [1,1], [1,-1] ].map(([sx,sy]) => ({
      x: sx * distance * Math.cos(phi * rad),
      y: sy * (pivot + distance * Math.sin(phi * rad)),
    })),
  };
}
export type Result = ReturnType<typeof calculate>;
export function isInputs(value: unknown): value is Inputs {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string,unknown>;
  const textKeys = ['alpha','pivot','c','x0','h0','target','groundElevation','id','guy'];
  const angle = (a: unknown) => !!a && typeof a === 'object' && ['deg','min','sec'].every(k => typeof (a as Record<string,unknown>)[k] === 'string');
  return textKeys.every(k => typeof v[k] === 'string') && angle(v.beta) && angle(v.phi) && ['GI6KL','G6KL','GR6KL'].includes(String(v.tower)) && ['3','4'].includes(String(v.soil)) && ['fixed','terrain'].includes(String(v.datum)) && ['depth','x','seal'].includes(String(v.mode)) && ['1','2','3','4'].includes(String(v.guy));
}
/** Keeps previous saved cases compatible while discarding retired/unknown input fields. */
export function readInputs(value: unknown): Inputs | null {
  if (!isInputs(value)) return null;
  return Object.fromEntries(Object.keys(DEFAULTS).map(key => [key, value[key as keyof Inputs]])) as Inputs;
}
