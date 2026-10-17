/** Transcripción visual de Tabla 1 de los seis planos proporcionados. Sin interpolación. */
export const ALPHAS = [0, 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20] as const;
export type Tower = 'GI6KL' | 'G6KL' | 'GR6KL';
export type Soil = '3' | '4';
export const CATALOG = {
  GI6KL: {
    beta: 57.117,
    '3': { h: 3.5, x: [1.998, 2.056, 2.117, 2.184, 2.255, 2.332, 2.416, 2.509, 2.612], sheet: 'CNX-KILO-033-DL-LG-CV-PLN-E-0005.L0026', revision: '3 · 13-04-2026' },
    '4': { h: 4, x: [2.321, 2.388, 2.460, 2.537, 2.620, 2.709, 2.807, 2.915, 3.035], sheet: 'CNX-KILO-033-DL-LG-CV-PLN-E-0005.L0027', revision: '3 · 13-04-2026' },
  },
  G6KL: {
    beta: 49.843,
    '3': { h: 3, x: [1.688, 1.752, 1.822, 1.898, 1.983, 2.076, 2.181, 2.299, 2.436], sheet: 'CNX-KILO-033-DL-LG-CV-PLN-E-0007-L0024', revision: '3 · 07-04-2026' },
    '4': { h: 3.5, x: [2.109, 2.190, 2.278, 2.373, 2.478, 2.595, 2.726, 2.874, 3.044], sheet: 'CNX-KILO-033-DL-LG-CV-PLN-E-0007-L0025', revision: '3 · 07-04-2026' },
  },
  GR6KL: {
    beta: 49.794,
    '3': { h: 3, x: [1.691, 1.755, 1.825, 1.902, 1.987, 2.080, 2.185, 2.305, 2.442], sheet: 'CNX-KILO-033-DL-LG-CV-PLN-E-0008-L0024', revision: '4 · 13-04-2026' },
    '4': { h: 3.5, x: [2.113, 2.194, 2.282, 2.378, 2.483, 2.600, 2.732, 2.881, 3.052], sheet: 'CNX-KILO-033-DL-LG-CV-PLN-E-0008-L0025', revision: '4 · 13-04-2026' },
  },
} as const;
