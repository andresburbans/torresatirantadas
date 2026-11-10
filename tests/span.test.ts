import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angleText, exampleSpan, isSpan, newSpan, parseAngle, phaseGeometry, sagAt, sagCheck, sagTable, sagTarget, tempAt } from '../src/lib/span';

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
  // T = w·a²/(8·f) con el peso real del conductor Flint (1,0349 kg/m).
  near(sagTarget(p, 'sup', 20).tension, 1.0349 * 138.5139 ** 2 / (8 * 2.0123), .5);
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
  assert.equal(isSpan(JSON.parse(JSON.stringify(exampleSpan()))), true);
  assert.equal(isSpan({ ...exampleSpan(), phases: {} }), false);
});
