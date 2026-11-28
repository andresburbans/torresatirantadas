import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addSpan, angleInput, angleText, convertAngles, currentSpan, exampleSpan, logCheck, logCsv, newSpan, nextSpan, parseAngle, phaseGeometry, readSpan, readStore, removeSpan, sagAt, sagCheck, sagTable, sagTarget, tempAt, updateCurrent } from '../src/lib/span';

const near = (actual: number, expected: number, tolerance: number) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected} ± ${tolerance}`);
const gon = (deg: number) => deg / .9;

test('reproduce la geometría de la planilla Vano T.122 – T.124', () => {
  const p = exampleSpan();
  const expected = { sup: [138.5139, 26.7292, 2.369, 17.0766, 82.3907], med: [138.5961, 26.7823, 2.4014, 14.7254, 83.9512], inf: [138.5481, 26.7259, 2.3787, 12.3667, 85.6871] } as const;
  for (const id of ['sup', 'med', 'inf'] as const) {
    const g = phaseGeometry(p, id), [span, hLeft, hRight, midDist, midHz] = expected[id];
    assert.equal(g.valid, true);
    near(g.span, span, .0005); near(g.hLeft, hLeft, .0005); near(g.hRight, hRight, .0005); near(g.midDist, midDist, .0005); near(gon(g.midHz), midHz, .001);
    assert.deepEqual(g.warnings, []);
  }
});

test('reproduce flecha corregida y cenital de flechado de la planilla', () => {
  const p = exampleSpan();
  const cases = [['sup', 5, 1.6375, 58.7857], ['sup', 20, 2.0123, 59.6841], ['sup', 40, 2.5252, 60.9445], ['med', 20, 2.0147, 54.9988], ['inf', 30, 2.2699, 50.2177]] as const;
  for (const [id, temp, sag, zenith] of cases) {
    const t = sagTarget(p, id, temp);
    assert.equal(t.valid, true);
    near(t.sag, sag, .0002); near(gon(t.zenith), zenith, .001);
  }
  // H = w·a²/(8·f·cos ψ) con el peso real del conductor Flint (1,0349 kg/m) y desnivel 24,36 m.
  const cos = 138.5139 / Math.hypot(138.5139, 26.7292 - 2.369);
  near(sagTarget(p, 'sup', 20).tension, 1.0349 * 138.5139 ** 2 / (8 * 2.0123 * cos), .5);
});

test('interpola por tramos y no extrapola fuera de la tabla', () => {
  const table = sagTable(exampleSpan());
  near(sagAt(table, 25)!, 2.17, 1e-9); near(sagAt(table, 12)!, 1.838, 1e-9);
  assert.equal(sagAt(table, 4.9), null); assert.equal(sagAt(table, 41), null);
  near(tempAt(table, 2.17)!, 25, 1e-9);
  assert.equal(sagTarget(exampleSpan(), 'sup', 45).valid, false);
});

test('la verificación recupera la flecha y aplica la tolerancia en valor absoluto', () => {
  const p = exampleSpan(), target = sagTarget(p, 'sup');
  p.phases.sup.checkV = String(gon(target.zenith));
  const exact = sagCheck(p, 'sup');
  near(exact.diff, 0, 1e-6); assert.equal(exact.ok, true); near(exact.tempEq!, 20, 1e-4);
  // Conductor 13 cm más alto (sobretensado): la planilla original lo daba por bueno.
  const high = 90 - Math.atan2(target.geometry.chordMid - target.sag + .13, target.geometry.midDist) * 180 / Math.PI;
  p.phases.sup.checkV = String(gon(high));
  const tight = sagCheck(p, 'sup');
  near(tight.diff, -.13, 1e-6); near(tight.tolerance, target.sag * .02, 1e-9); assert.equal(tight.ok, false);
  assert.ok(tight.tension > target.tension);
});

test('distancia inclinada y unidades sexagesimales dan el mismo resultado', () => {
  const base = exampleSpan(), p = exampleSpan();
  p.distanceKind = 'slope'; p.angleUnit = 'deg';
  for (const id of ['sup', 'med', 'inf'] as const) for (const side of ['left', 'right'] as const) {
    const shot = base.phases[id][side], z = Number(shot.v) * .9;
    p.phases[id][side] = { dist: String(Number(shot.dist) / Math.sin(z * Math.PI / 180)), v: String(z), hz: String(Number(shot.hz) * .9) };
  }
  near(sagTarget(p, 'med').zenith, sagTarget(base, 'med').zenith, 1e-9);
  near(phaseGeometry(p, 'inf').span, phaseGeometry(base, 'inf').span, 1e-9);
});

test('el giro al punto medio funciona con cualquier lectura de círculo', () => {
  const p = exampleSpan(), base = phaseGeometry(p, 'sup');
  p.phases.sup.left.hz = '350'; p.phases.sup.right.hz = String((350 + 169.2378) % 400);
  near(gon(phaseGeometry(p, 'sup').midHz), (350 + gon(base.midHz)) % 400, 1e-6);
});

test('ángulos: centesimal, decimal y GGG.MMSS', () => {
  near(parseAngle('100', 'gon'), 90, 1e-12); near(parseAngle('77,5', 'deg'), 77.5, 1e-12);
  near(parseAngle('77.2115', 'dms'), 77 + 21 / 60 + 15 / 3600, 1e-12); near(parseAngle('77 21 15', 'dms'), 77 + 21 / 60 + 15 / 3600, 1e-12);
  assert.ok(Number.isNaN(parseAngle('77.3', 'dms')));
  assert.ok(Number.isNaN(parseAngle('77.6000', 'dms')));
  assert.equal(angleText(77 + 21 / 60 + 15 / 3600, 'dms'), '77° 21′ 15″');
  assert.equal(angleText(90, 'gon'), '100,0000 gon');
});

test('avisa cuando el vano no cuadra y valida la tabla y la sesión', () => {
  const p = exampleSpan(); p.phases.sup.right.hz = '150';
  assert.equal(phaseGeometry(p, 'sup').warnings.length > 0, true);
  const bad = exampleSpan(); bad.table[2].sag = '1.70';
  assert.equal(sagTable(bad).valid, false);
  assert.equal(sagTarget(newSpan(), 'sup').valid, false);
  const ex = exampleSpan();
  assert.deepEqual(readSpan(JSON.parse(JSON.stringify(ex))), ex);
  assert.equal(readSpan({ ...exampleSpan(), phases: {} }), null);
});

/** Vano tal como lo guardaba v2.3.x (esquema 1): Δ vertical común y una sola tabla. */
function schema1() {
  const p = exampleSpan() as unknown as Record<string, unknown>;
  const phases = Object.fromEntries(Object.entries(p.phases as Record<string, Record<string, unknown>>).map(([id, ph]) => [id, { left: ph.left, right: ph.right, checkV: ph.checkV }]));
  const { id: _id, tableSpan: _t, gw: _g, log: _l, ...rest } = p;
  return JSON.parse(JSON.stringify({ ...rest, schema: 1, offsetLeft: '-3.2', offsetRight: '0', phases }));
}

test('migra el vano de esquema 1 sin cambiar resultados y lo guarda como almacén', () => {
  const old = schema1(), p = readSpan(old)!;
  assert.equal(p.schema, 2); assert.equal(p.phases.gw.offLeft, '-3.2'); assert.equal(p.phases.sup.offRight, '0');
  assert.equal(p.tableSpan, ''); assert.deepEqual(p.log, []);
  const store = readStore(old)!;
  assert.equal(store.spans.length, 1); assert.equal(store.current, store.spans[0].id);
  assert.equal(readSpan({ ...old, offsetLeft: 3 }), null);
});

test('el Δ vertical es propio de cada fase: el cable de guarda no lleva cadena', () => {
  const p = exampleSpan(), base = phaseGeometry(p, 'sup');
  p.phases.sup.offLeft = '-3.5'; p.phases.sup.offRight = '-3.5';
  const low = phaseGeometry(p, 'sup');
  near(low.hLeft, base.hLeft - 3.5, 1e-9); near(low.drop, base.drop, 1e-9);
  near(phaseGeometry(p, 'med').hLeft, phaseGeometry(exampleSpan(), 'med').hLeft, 1e-12);
});

test('el cable de guarda usa su propia tabla y su propio peso', () => {
  const p = exampleSpan();
  p.phases.gw = { ...p.phases.sup };
  assert.equal(sagTarget(p, 'gw').valid, false);
  assert.match(sagTarget(p, 'gw').error, /cable de guarda/);
  p.gw = { weight: '0.5', breaking: '', table: [{ t: '10', sag: '1.20' }, { t: '30', sag: '1.60' }] };
  const gw = sagTarget(p, 'gw', 20), sup = sagTarget(p, 'sup', 20);
  near(gw.sagTable, 1.4, 1e-9); assert.ok(gw.sag < sup.sag); assert.ok(Number.isNaN(gw.uts));
  near(gw.tension, .5 * gw.geometry.span ** 2 / (8 * gw.sag * gw.geometry.cosSlope), 1e-9);
});

test('vano de la tabla (regulador del cantón): la flecha escala con el vano medido', () => {
  const p = exampleSpan(), ref = sagTarget(p, 'sup', 20);
  p.tableSpan = '150'; p.spanDesign = '138.5';
  const t = sagTarget(p, 'sup', 20);
  near(t.sag, 2.04 * (ref.geometry.span / 150) ** 2, 1e-9);
  assert.deepEqual(t.geometry.warnings, []); // El aviso de vano compara con el vano de proyecto, no con el de la tabla.
});

test('errores concretos por lectura y círculo II', () => {
  const p = exampleSpan(); p.phases.med.right.v = '302.1320';
  assert.match(phaseGeometry(p, 'med').errors[0], /Fase media · torre derecha, cenital en círculo II/);
  p.phases.med.left.dist = 'x';
  assert.match(phaseGeometry(p, 'med').errors[0], /torre izquierda, distancia no válida; torre derecha/);
  assert.match(phaseGeometry(p, 'gw').errors[0], /faltan las lecturas/);
});

test('cambiar la unidad convierte las lecturas sin cambiar el resultado', () => {
  const p = exampleSpan(); p.phases.sup.checkV = '59.6846'; p.phases.med.right.v = '97,8';
  const z = sagTarget(p, 'sup').zenith;
  for (const unit of ['deg', 'dms'] as const) {
    const q = convertAngles(p, unit);
    assert.equal(q.angleUnit, unit);
    near(sagTarget(q, 'sup').zenith, z, unit === 'dms' ? 2e-5 : 1e-6);
    near(parseAngle(q.phases.sup.checkV, unit), 59.6846 * .9, 2e-5);
    near(Number(convertAngles(q, 'gon').phases.inf.right.hz), 177.5326, unit === 'dms' ? 1e-4 : 1e-9);
  }
  assert.equal(angleInput(77 + 21 / 60 + 15.3 / 3600, 'dms'), '77.21153');
  assert.equal(angleInput(90, 'gon'), '100.0000');
  const blank = convertAngles({ ...p, phases: { ...p.phases, gw: { ...p.phases.gw, left: { dist: '', v: 'abc', hz: '' } } } }, 'deg');
  assert.equal(blank.phases.gw.left.v, 'abc');
});

test('registro de verificaciones y CSV para Excel', () => {
  const p = exampleSpan(), target = sagTarget(p, 'sup');
  assert.equal(logCheck(p), null);
  p.phases.sup.checkV = String(gon(target.zenith) + .02); p.mode = 'check';
  const logged = logCheck(p, new Date(2026, 10, 28, 9, 5))!;
  assert.equal(logged.log.length, 1); assert.equal(logged.log[0].phase, 'sup');
  near(logged.log[0].diff, sagCheck(p, 'sup').diff, 1e-12);
  const csv = logCsv([logged]).split('\r\n');
  assert.match(csv[0], /^Fecha;Hora;Vano;Conductor/);
  assert.match(csv[1], /^2026-11-28;09:05;T\.122 – T\.124;Superior;20,0;/);
  assert.equal(readSpan(JSON.parse(JSON.stringify(logged)))!.log.length, 1);
});

test('varios vanos: siguiente del cantón conserva la tabla y vacía las lecturas', () => {
  const p = exampleSpan(); p.phases.inf.offLeft = '-2'; p.phases.sup.checkV = '60';
  const next = nextSpan(p);
  assert.notEqual(next.id, p.id); assert.deepEqual(next.table, p.table); assert.equal(next.tableSpan, '139.464');
  assert.equal(next.phases.sup.left.dist, ''); assert.equal(next.phases.sup.checkV, ''); assert.equal(next.phases.inf.offLeft, '-2'); assert.equal(next.name, '');
  let store = addSpan({ spans: [p], current: p.id }, next);
  assert.equal(currentSpan(store).id, next.id);
  store = updateCurrent(store, q => ({ ...q, name: 'T.124 – T.125' }));
  assert.equal(store.spans[1].name, 'T.124 – T.125'); assert.equal(store.spans[0].name, 'T.122 – T.124');
  store = removeSpan(store, next.id);
  assert.equal(store.current, p.id); assert.equal(store.spans.length, 1);
  const only = removeSpan(store, p.id);
  assert.equal(only.spans.length, 1); assert.notEqual(only.current, p.id);
  const dup = readStore(JSON.parse(JSON.stringify({ current: 'x', spans: [p, p] })))!;
  assert.equal(new Set(dup.spans.map(s => s.id)).size, 2);
  assert.equal(readStore({ spans: [{}] }), null);
});
