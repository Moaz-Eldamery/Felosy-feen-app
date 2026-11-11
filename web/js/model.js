// Pure helpers: categories, Cairo time, money, and monthly aggregation.

export const TZ = 'Africa/Cairo';

export const CATEGORIES = [
  { id: 'food', label: 'Food & Drinks', short: 'Food', icon: 'food', color: 'green' },
  { id: 'water', label: 'Water', short: 'Water', icon: 'water', color: 'cyan' },
  { id: 'computer', label: 'Computer Accessories', short: 'Computer', icon: 'computer', color: 'indigo' },
  { id: 'clothes', label: 'Clothes', short: 'Clothes', icon: 'clothes', color: 'purple' },
  { id: 'bills', label: 'Bills', short: 'Bills', icon: 'bills', color: 'brown' },
  { id: 'transport', label: 'Transportation', short: 'Transport', icon: 'transport', color: 'blue' },
  { id: 'vodafone', label: 'Vodafone Bills', short: 'Vodafone', icon: 'vodafone', color: 'vodafone' },
  { id: 'others', label: 'Others', short: 'Others', icon: 'others', color: 'gray' },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
  { id: 'applepay', label: 'Apple Pay' },
];
export const METHOD = Object.fromEntries(METHODS.map((m) => [m.id, m]));

export const NEAR = 0.8; // warn at 80% of a budget

// ---------- Cairo time ----------

const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function cairoParts(date = new Date()) {
  const p = {};
  for (const { type, value } of partsFmt.formatToParts(date)) p[type] = value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, s: +p.second };
}

const pad = (n) => String(n).padStart(2, '0');

export function monthKey(date = new Date()) {
  const { y, m } = cairoParts(date);
  return `${y}-${pad(m)}`;
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthLabel(key, { year = true } = {}) {
  const [y, m] = key.split('-').map(Number);
  const name = new Date(Date.UTC(y, m - 1, 15)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return year ? `${name} ${y}` : name;
}

/** "2026-11-09T14:05" in Cairo wall time, for <input type="datetime-local">. */
export function toCairoInput(date = new Date()) {
  const p = cairoParts(date);
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

/** Inverse of toCairoInput: Cairo wall time -> real instant (handles DST). */
export function fromCairoInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let guess = wall;
  for (let i = 0; i < 3; i++) {
    const p = cairoParts(new Date(guess));
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
    guess += wall - seen;
  }
  return new Date(guess);
}

export function dayKey(iso) {
  const p = cairoParts(new Date(iso));
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export function dayLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  const today = cairoParts();
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const yesterday = new Date(Date.UTC(today.y, today.m - 1, today.d - 1, 12));
  if (y === today.y && m === today.m && d === today.d) return 'Today';
  if (date.getTime() === yesterday.getTime()) return 'Yesterday';
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  return `${weekday}, ${d} ${month}`;
}

export function timeLabel(iso) {
  const p = cairoParts(new Date(iso));
  return `${pad(p.h)}:${pad(p.min)}`;
}

/** "Today, 14:05" / "Yesterday, 09:30" / "3 November, 18:12" */
export function shortDateTime(iso) {
  const day = dayLabel(dayKey(iso)).replace(/^\w+, /, '');
  return `${day}, ${timeLabel(iso)}`;
}

// ---------- money ----------

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const exact = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 6320 -> "6,320"; 120.5 -> "120.50" when exact. */
export function money(n, { exact: ex = false } = {}) {
  if (ex) {
    const s = exact.format(n);
    return /\.\d$/.test(s) ? s + '0' : s;
  }
  return whole.format(Math.round(n));
}

export const round2 = (n) => Math.round(n * 100) / 100;

// ---------- aggregation ----------

/**
 * Everything the overview needs for one month.
 * `asOf` is the Cairo day number the month is "at" (today for the current month,
 * the last day for past months).
 */
export function summarize({ month, payments, budgets }, currentMonth = monthKey()) {
  const days = daysInMonth(month);
  const isCurrent = month === currentMonth;
  const isFuture = month > currentMonth;
  const asOf = isCurrent ? cairoParts().d : isFuture ? 0 : days;

  const byCat = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  const perDay = new Array(days + 1).fill(0);
  let total = 0;
  for (const p of payments) {
    if (!p.category) continue;
    byCat[p.category] = round2((byCat[p.category] || 0) + p.amount);
    total = round2(total + p.amount);
    const day = +dayKey(p.paid_at).slice(8, 10);
    perDay[day] = round2(perDay[day] + p.amount);
  }
  const cumulative = [0];
  for (let d = 1; d <= days; d++) cumulative[d] = round2(cumulative[d - 1] + perDay[d]);

  const budgetTotal = CATEGORIES.reduce((s, c) => s + (budgets?.[c.id] || 0), 0);

  const rows = CATEGORIES.map((c) => {
    const spent = byCat[c.id];
    const budget = budgets?.[c.id] || null;
    const ratio = budget ? spent / budget : null;
    const state = !budget ? 'none' : spent > budget ? 'over' : ratio >= NEAR ? 'near' : 'ok';
    return { ...c, spent, budget, ratio, state, over: budget ? round2(spent - budget) : 0 };
  });

  const alerts = rows
    .filter((r) => r.state === 'over' || r.state === 'near')
    .sort((a, b) => (a.state === b.state ? b.ratio - a.ratio : a.state === 'over' ? -1 : 1));

  const paceToday = budgetTotal ? round2((budgetTotal * asOf) / days) : null;

  return {
    month, days, asOf, isCurrent, total, budgetTotal, rows, alerts,
    cumulative, paceToday, daysLeft: isCurrent ? days - asOf : 0,
  };
}
