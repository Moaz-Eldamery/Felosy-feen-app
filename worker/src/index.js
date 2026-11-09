// Spending API — Cloudflare Worker + D1.
// Static files in /web are served by Workers Assets; every /api/* request lands here.

export const CATEGORIES = [
  'food', 'water', 'computer', 'clothes', 'bills', 'transport', 'gifts', 'others',
];
const METHODS = ['cash', 'card', 'applepay'];
const TZ = 'Africa/Cairo';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
    try {
      return await route(request, env, url);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Something went wrong on the server.' }, 500);
    }
  },
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function route(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method;

  // The Shortcut may send the key in the body, so capture reads it before the auth check.
  let body = null;
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const text = await request.text();
    try {
      body = text.trim() ? JSON.parse(text) : {};
    } catch {
      throw new HttpError(400, 'Request body must be JSON.');
    }
  }
  authorize(request, env, url, body);

  if (path === '/api/ping' && method === 'GET') return json({ ok: true });

  if (path === '/api/state' && method === 'GET') {
    const month = url.searchParams.get('month') || cairoMonth(new Date());
    assertMonth(month);
    return json(await loadState(env.DB, month));
  }

  if (path === '/api/payments' && method === 'POST') {
    return json(await createPayment(env.DB, body, 'manual'), 201);
  }

  if (path === '/api/capture' && method === 'POST') {
    // Called by the iOS Shortcut "Wallet transaction" automation.
    const amount = parseLooseAmount(body.amount);
    if (!amount) throw new HttpError(400, `Couldn't read an amount from "${body.amount}".`);
    const payment = await createPayment(env.DB, {
      id: crypto.randomUUID(),
      amount,
      category: null,
      method: 'applepay',
      note: String(body.merchant || body.note || '').slice(0, 80),
      paid_at: new Date().toISOString(),
    }, 'applepay');
    return json({ ok: true, payment, message: `Saved EGP ${amount} — open the app to pick a category.` }, 201);
  }

  const match = path.match(/^\/api\/payments\/([\w-]{8,64})(\/restore)?$/);
  if (match) {
    const [, id, restore] = match;
    if (restore && method === 'POST') return json(await restorePayment(env.DB, id));
    if (!restore && method === 'PATCH') return json(await updatePayment(env.DB, id, body));
    if (!restore && method === 'DELETE') return json(await deletePayment(env.DB, id));
  }

  if (path === '/api/budgets' && method === 'PUT') {
    return json(await saveBudgets(env.DB, body));
  }

  if (path === '/api/export' && method === 'GET') {
    return exportCsv(env.DB, url.searchParams.get('month') || 'all');
  }

  throw new HttpError(404, 'Unknown endpoint.');
}

// ---------- auth ----------

function authorize(request, env, url, body) {
  const expected = env.APP_KEY;
  if (!expected) throw new HttpError(500, 'APP_KEY is not configured on the server.');
  const header = request.headers.get('authorization') || '';
  const given = header.replace(/^Bearer\s+/i, '') || (body && body.key) || url.searchParams.get('key') || '';
  if (!timingSafeEqual(String(given), String(expected))) throw new HttpError(401, 'Wrong or missing key.');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------- reads ----------

async function loadState(db, month) {
  const [payments, unsorted, budgets, months] = await Promise.all([
    db.prepare(
      `SELECT * FROM payments WHERE month = ? AND deleted_at IS NULL AND category IS NOT NULL
       ORDER BY paid_at DESC`,
    ).bind(month).all(),
    db.prepare(
      `SELECT * FROM payments WHERE category IS NULL AND deleted_at IS NULL ORDER BY paid_at ASC`,
    ).all(),
    budgetsFor(db, month),
    db.prepare(
      `SELECT month, SUM(amount_cents) AS total_cents, COUNT(*) AS count FROM payments
       WHERE deleted_at IS NULL AND category IS NOT NULL GROUP BY month ORDER BY month DESC`,
    ).all(),
  ]);
  return {
    month,
    payments: payments.results.map(outPayment),
    unsorted: unsorted.results.map(outPayment),
    budgets,
    months: months.results.map((r) => ({ month: r.month, total: r.total_cents / 100, count: r.count })),
  };
}

async function budgetsFor(db, month) {
  const rows = await db.prepare(
    `SELECT b.category, b.amount_cents FROM budgets b
     JOIN (SELECT category, MAX(effective_month) AS m FROM budgets WHERE effective_month <= ? GROUP BY category) x
       ON x.category = b.category AND x.m = b.effective_month`,
  ).bind(month).all();
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, null]));
  for (const r of rows.results) {
    if (r.category in out) out[r.category] = r.amount_cents == null ? null : r.amount_cents / 100;
  }
  return out;
}

function outPayment(r) {
  return {
    id: r.id,
    amount: r.amount_cents / 100,
    category: r.category,
    method: r.method,
    note: r.note,
    paid_at: r.paid_at,
    month: r.month,
    source: r.source,
    edited: !!r.edited,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

// ---------- writes ----------

async function createPayment(db, input, source) {
  const p = validatePayment(input, { partial: false, allowUnsorted: source === 'applepay' });
  const id = String(input.id || crypto.randomUUID());
  if (!/^[\w-]{8,64}$/.test(id)) throw new HttpError(400, 'Invalid payment id.');
  const now = new Date().toISOString();
  // INSERT OR IGNORE makes retries from the offline outbox idempotent.
  await db.prepare(
    `INSERT OR IGNORE INTO payments
       (id, amount_cents, category, method, note, paid_at, month, source, edited, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  ).bind(id, p.amount_cents, p.category, p.method, p.note, p.paid_at, cairoMonth(new Date(p.paid_at)), source, now, now).run();
  return getPayment(db, id);
}

async function updatePayment(db, id, input) {
  const existing = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();
  if (!existing) throw new HttpError(404, 'That payment no longer exists.');
  // category: null is allowed here so "Undo" can put a just-filed payment back in the unsorted list.
  const p = validatePayment(input, { partial: true, allowUnsorted: true });
  const next = {
    amount_cents: p.amount_cents ?? existing.amount_cents,
    category: p.category !== undefined ? p.category : existing.category,
    method: p.method ?? existing.method,
    note: p.note ?? existing.note,
    paid_at: p.paid_at ?? existing.paid_at,
  };
  // Filing an unsorted Apple Pay payment isn't a correction, so only changes to an
  // already-filed payment mark it as edited.
  const changed = ['amount_cents', 'category', 'method', 'note', 'paid_at'].some((k) => next[k] !== existing[k]);
  const edited = existing.edited || (existing.category !== null && next.category !== null && changed ? 1 : 0);
  await db.prepare(
    `UPDATE payments SET amount_cents = ?, category = ?, method = ?, note = ?, paid_at = ?, month = ?,
       edited = ?, updated_at = ? WHERE id = ?`,
  ).bind(next.amount_cents, next.category, next.method, next.note, next.paid_at,
    cairoMonth(new Date(next.paid_at)), edited, new Date().toISOString(), id).run();
  return getPayment(db, id);
}

async function deletePayment(db, id) {
  const res = await db.prepare('UPDATE payments SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL')
    .bind(new Date().toISOString(), id).run();
  return { ok: true, changed: res.meta.changes };
}

async function restorePayment(db, id) {
  await db.prepare('UPDATE payments SET deleted_at = NULL WHERE id = ?').bind(id).run();
  return getPayment(db, id);
}

async function getPayment(db, id) {
  const row = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();
  if (!row) throw new HttpError(404, 'That payment no longer exists.');
  return outPayment(row);
}

async function saveBudgets(db, body) {
  const month = body.month || cairoMonth(new Date());
  assertMonth(month);
  const budgets = body.budgets || {};
  const stmts = [];
  for (const cat of Object.keys(budgets)) {
    if (!CATEGORIES.includes(cat)) throw new HttpError(400, `Unknown category "${cat}".`);
    const v = budgets[cat];
    let cents = null;
    if (v !== null && v !== '' && v !== undefined) {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 10_000_000) throw new HttpError(400, `Budget for ${cat} must be a positive number.`);
      cents = n === 0 ? null : Math.round(n * 100);
    }
    stmts.push(db.prepare(
      `INSERT INTO budgets (category, effective_month, amount_cents) VALUES (?, ?, ?)
       ON CONFLICT (category, effective_month) DO UPDATE SET amount_cents = excluded.amount_cents`,
    ).bind(cat, month, cents));
  }
  if (stmts.length) await db.batch(stmts);
  return { month, budgets: await budgetsFor(db, month) };
}

function validatePayment(input, { partial, allowUnsorted }) {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Missing payment.');
  const out = {};
  if (!partial || input.amount !== undefined) {
    const n = Number(input.amount);
    if (!Number.isFinite(n) || n <= 0 || n > 10_000_000) throw new HttpError(400, 'Amount must be more than 0.');
    out.amount_cents = Math.round(n * 100);
  }
  if (!partial || input.category !== undefined) {
    if (input.category === null && allowUnsorted) out.category = null;
    else if (!CATEGORIES.includes(input.category)) throw new HttpError(400, 'Pick a category.');
    else out.category = input.category;
  }
  if (!partial || input.method !== undefined) {
    const m = input.method || 'card';
    if (!METHODS.includes(m)) throw new HttpError(400, 'Unknown payment method.');
    out.method = m;
  }
  if (!partial || input.note !== undefined) out.note = String(input.note || '').trim().slice(0, 80);
  if (!partial || input.paid_at !== undefined) {
    const d = new Date(input.paid_at || Date.now());
    if (Number.isNaN(d.getTime())) throw new HttpError(400, 'Invalid date.');
    out.paid_at = d.toISOString();
  }
  return out;
}

// ---------- export ----------

const LABELS = {
  food: 'Food & Drinks', water: 'Water', computer: 'Computer Accessories', clothes: 'Clothes',
  bills: 'Bills', transport: 'Transportation', gifts: 'Gifts', others: 'Others',
};
const METHOD_LABELS = { cash: 'Cash', card: 'Card', applepay: 'Apple Pay' };

async function exportCsv(db, month) {
  if (month !== 'all') assertMonth(month);
  const stmt = month === 'all'
    ? db.prepare('SELECT * FROM payments WHERE deleted_at IS NULL ORDER BY paid_at ASC')
    : db.prepare('SELECT * FROM payments WHERE deleted_at IS NULL AND month = ? ORDER BY paid_at ASC').bind(month);
  const { results } = await stmt.all();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const lines = [['Date (Cairo)', 'Month', 'Category', 'Amount (EGP)', 'Method', 'Note', 'Edited'].join(',')];
  for (const r of results) {
    lines.push([
      fmt.format(new Date(r.paid_at)).replace(',', ''),
      r.month,
      r.category ? LABELS[r.category] : 'Unsorted',
      (r.amount_cents / 100).toFixed(2),
      METHOD_LABELS[r.method] || r.method,
      r.note,
      r.edited ? 'yes' : '',
    ].map(csvCell).join(','));
  }
  // BOM so Excel opens UTF-8 (Arabic notes) correctly.
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="spending-${month}.csv"`,
    },
  });
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------- helpers ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function cairoMonth(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year').value;
  const m = parts.find((p) => p.type === 'month').value;
  return `${y}-${m}`;
}

function assertMonth(m) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) throw new HttpError(400, 'Month must look like 2026-11.');
}

// Wallet sends amounts like "EGP 1,250.00", "E£120", "١٢٠٫٥٠ ج.م.‏" — pull the number out.
export function parseLooseAmount(raw) {
  if (typeof raw === 'number') return raw > 0 ? Math.round(raw * 100) / 100 : 0;
  let s = String(raw || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(/[^\d.,]/g, '');
  if (!s) return 0;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastComma > lastDot && s.length - lastComma - 1 <= 2) {
    s = s.replace(/\./g, '').replace(',', '.'); // 1.250,50 or 120,5
  } else {
    s = s.replace(/,/g, '');
  }
  s = s.replace(/^\.+|\.+$/g, '');
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}
