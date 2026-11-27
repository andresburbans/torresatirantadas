import data from '../data/tower-designs.json';

/** Tablas de diseño por familia y suelo (src/data/tower-designs.json). Sin interpolación. */
export type Tower = 'GI6KL' | 'G6KL' | 'GR6KL';
export type Soil = '3' | '4';
export const TOWERS = ['GI6KL', 'G6KL', 'GR6KL'] as const satisfies readonly Tower[];
export type SoilTable = { h: number; x: readonly number[]; sheet: string; revision: string };
export type TowerDesign = { beta: number; pivot: number; pivotSource: string } & Record<Soil, SoilTable>;
export const ALPHAS: readonly number[] = data.alphas;
export const DEFAULT_ALPHA = String(data.defaultAlpha);
export const CATALOG = Object.fromEntries(TOWERS.map(t => {
  const { soils, ...rest } = data.towers[t];
  return [t, { ...rest, ...soils }];
})) as unknown as Record<Tower, TowerDesign>;
/** X₀/H₀ de una fila α; null si la fila no existe en la tabla. */
export function designRow(tower: Tower, soil: Soil, alpha: string | number) {
  const a = typeof alpha === 'number' ? alpha : Number(String(alpha).trim().replace(',', '.'));
  const index = ALPHAS.findIndex(v => v === a);
  if (index < 0) return null;
  const table = CATALOG[tower][soil];
  return { alpha: ALPHAS[index], x: table.x[index], h: table.h };
}
