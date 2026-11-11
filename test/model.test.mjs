import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLooseAmount, cairoMonth } from '../worker/src/index.js';
import { toCairoInput, fromCairoInput, summarize, monthKey, daysInMonth, shiftMonth } from '../web/js/model.js';

test('reads Wallet amounts in the formats iOS sends', () => {
  assert.equal(parseLooseAmount('EGP 1,250.00'), 1250);
  assert.equal(parseLooseAmount('E£120'), 120);
  assert.equal(parseLooseAmount('١٢٠٫٥٠ ج.م.‏'), 120.5);
  assert.equal(parseLooseAmount('1.250,50 EGP'), 1250.5);
  assert.equal(parseLooseAmount('85,5'), 85.5);
  assert.equal(parseLooseAmount(42.129), 42.13);
  assert.equal(parseLooseAmount('free'), 0);
  assert.equal(parseLooseAmount(''), 0);
});

test('Cairo month boundaries (UTC+2, and UTC+3 during summer time)', () => {
  // 23:30 UTC on Oct 31 is already Nov 1 in Cairo (UTC+2 after DST ends).
  assert.equal(cairoMonth(new Date('2026-10-31T23:30:00Z')), '2026-11');
  // 21:30 UTC on Jun 30 is 00:30 Jul 1 in Cairo (UTC+3).
  assert.equal(cairoMonth(new Date('2026-06-30T21:30:00Z')), '2026-07');
  assert.equal(monthKey(new Date('2026-06-30T20:30:00Z')), '2026-06');
});

test('Cairo wall-time input round-trips', () => {
  for (const iso of ['2026-11-09T12:05:00.000Z', '2026-07-15T18:40:00.000Z', '2026-01-01T00:00:00.000Z']) {
    const d = new Date(iso);
    assert.equal(fromCairoInput(toCairoInput(d)).toISOString(), iso);
  }
  assert.equal(fromCairoInput('nonsense'), null);
});

test('month helpers', () => {
  assert.equal(daysInMonth('2028-02'), 29);
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('summary: totals, warnings, and no-limit categories', () => {
  const p = (amount, category, day) => ({ amount, category, paid_at: `2026-10-${String(day).padStart(2, '0')}T10:00:00Z` });
  const sum = summarize({
    month: '2026-10',
    payments: [p(900, 'food', 1), p(150.25, 'food', 3), p(1200, 'computer', 4), p(500, 'vodafone', 5), p(70, 'water', 31)],
    budgets: { food: 1300, computer: 1000, water: 300, vodafone: null },
  }, '2026-11');
  assert.equal(sum.total, 2820.25);
  assert.equal(sum.budgetTotal, 2600);
  assert.equal(sum.asOf, 31); // past month: whole month
  assert.equal(sum.cumulative[31], 2820.25);
  assert.deepEqual(sum.alerts.map((a) => [a.id, a.state]), [['computer', 'over'], ['food', 'near']]);
  assert.equal(sum.rows.find((r) => r.id === 'vodafone').state, 'none');
  assert.equal(sum.rows.find((r) => r.id === 'computer').over, 200);
});
