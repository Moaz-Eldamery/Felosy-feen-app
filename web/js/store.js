// Local-first store: renders from a localStorage cache instantly, applies every change
// optimistically, and syncs through an ordered outbox so logging works with no signal.

import { monthKey, round2 } from './model.js';

const LS = { key: 'spending.key', cache: 'spending.cache.v1', outbox: 'spending.outbox.v1' };

const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota/private mode */ } };

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function createStore({ onChange, onError, onAuth }) {
  let key = (() => { try { return localStorage.getItem(LS.key) || ''; } catch { return ''; } })();
  const cache = read(LS.cache, { months: {}, unsorted: [], index: [] });
  let outbox = read(LS.outbox, []);
  const deleted = new Map(); // id -> payment, for undo
  let online = true;
  let flushing = null;

  const persist = () => { write(LS.cache, cache); write(LS.outbox, outbox); };
  const emit = () => { persist(); onChange?.(); };

  async function api(method, path, body) {
    let res;
    try {
      res = await fetch(path, {
        method,
        headers: { authorization: `Bearer ${key}`, ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
    } catch {
      throw new ApiError(0, 'No connection.');
    }
    if (res.status === 401) { onAuth?.(); throw new ApiError(401, 'The key was rejected.'); }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data.error || `Server error (${res.status}).`);
    }
    return res;
  }

  // ---------- reads ----------

  async function refresh(month = monthKey()) {
    try {
      await flush();
      const data = await (await api('GET', `/api/state?month=${month}`)).json();
      // Keep any optimistic changes that are still waiting in the outbox.
      cache.months[month] = { month, payments: data.payments, budgets: data.budgets, at: Date.now() };
      cache.unsorted = data.unsorted;
      cache.index = data.months;
      for (const op of outbox) applyOp(op, { replay: true });
      online = true;
      emit();
      return true;
    } catch (err) {
      if (err.status === 0) { online = false; emit(); return false; }
      if (err.status !== 401) onError?.(err.message);
      return false;
    }
  }

  function monthData(month) {
    return cache.months[month] || null;
  }

  function budgetsFor(month) {
    const own = cache.months[month]?.budgets;
    if (own) return own;
    // Budgets repeat: borrow the nearest earlier cached month's budgets.
    const earlier = Object.keys(cache.months).filter((m) => m <= month).sort().pop();
    return earlier ? cache.months[earlier].budgets : {};
  }

  // ---------- writes ----------

  function enqueue(op) {
    outbox.push(op);
    applyOp(op);
    emit();
    flush();
  }

  function addPayment(p) {
    const payment = {
      id: crypto.randomUUID(),
      amount: round2(p.amount),
      category: p.category,
      method: p.method || 'card',
      note: (p.note || '').trim(),
      paid_at: p.paid_at || new Date().toISOString(),
      source: 'manual',
      edited: false,
    };
    enqueue({ type: 'create', payment });
    return payment;
  }

  function updatePayment(id, patch) {
    enqueue({ type: 'update', id, patch });
  }

  function deletePayment(id) {
    enqueue({ type: 'delete', id });
  }

  function restorePayment(id) {
    enqueue({ type: 'restore', id });
  }

  function saveBudgets(budgets) {
    enqueue({ type: 'budgets', month: monthKey(), budgets });
  }

  // ---------- optimistic application ----------

  function findPayment(id) {
    const u = cache.unsorted.findIndex((p) => p.id === id);
    if (u >= 0) return { list: cache.unsorted, index: u };
    for (const m of Object.values(cache.months)) {
      const i = m.payments.findIndex((p) => p.id === id);
      if (i >= 0) return { list: m.payments, index: i };
    }
    return null;
  }

  function place(p) {
    p.month = monthKey(new Date(p.paid_at));
    if (!p.category) {
      cache.unsorted.push(p);
      cache.unsorted.sort((a, b) => a.paid_at.localeCompare(b.paid_at));
      return;
    }
    const m = cache.months[p.month];
    if (m) {
      m.payments.push(p);
      m.payments.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
    }
    if (!cache.index.some((i) => i.month === p.month)) {
      cache.index.push({ month: p.month, total: 0, count: 0 });
      cache.index.sort((a, b) => b.month.localeCompare(a.month));
    }
  }

  function take(id) {
    const hit = findPayment(id);
    if (!hit) return null;
    return hit.list.splice(hit.index, 1)[0];
  }

  function applyOp(op, { replay = false } = {}) {
    if (op.type === 'create') {
      if (replay && findPayment(op.payment.id)) return;
      place({ ...op.payment });
    } else if (op.type === 'update') {
      const p = take(op.id);
      if (!p) return;
      const wasSorted = !!p.category;
      const next = { ...p, ...op.patch };
      if (op.patch.amount !== undefined) next.amount = round2(op.patch.amount);
      const changed = ['amount', 'category', 'method', 'note', 'paid_at'].some((k) => next[k] !== p[k]);
      if (wasSorted && next.category && changed) next.edited = true;
      place(next);
    } else if (op.type === 'delete') {
      const p = take(op.id);
      if (p) deleted.set(op.id, p);
    } else if (op.type === 'restore') {
      const p = deleted.get(op.id);
      if (p && !findPayment(op.id)) { place(p); deleted.delete(op.id); }
    } else if (op.type === 'budgets') {
      for (const m of Object.values(cache.months)) {
        if (m.month >= op.month) m.budgets = { ...m.budgets, ...normalizeBudgets(op.budgets) };
      }
    }
  }

  // ---------- sync ----------

  async function send(op) {
    if (op.type === 'create') return api('POST', '/api/payments', op.payment);
    if (op.type === 'update') return api('PATCH', `/api/payments/${op.id}`, op.patch);
    if (op.type === 'delete') return api('DELETE', `/api/payments/${op.id}`);
    if (op.type === 'restore') return api('POST', `/api/payments/${op.id}/restore`);
    if (op.type === 'budgets') return api('PUT', '/api/budgets', { month: op.month, budgets: op.budgets });
  }

  function flush() {
    if (flushing) return flushing;
    if (!key) return Promise.resolve();
    flushing = (async () => {
      while (outbox.length) {
        const op = outbox[0];
        try {
          await send(op);
          outbox.shift();
          online = true;
        } catch (err) {
          if (err.status === 0 || err.status >= 500 || err.status === 401) {
            online = err.status !== 0;
            break; // keep it; retry later
          }
          // The server refused this change for good (e.g. the payment was deleted elsewhere).
          outbox.shift();
          onError?.(err.message);
        }
      }
      persist();
      onChange?.();
    })().finally(() => { flushing = null; });
    return flushing;
  }

  async function exportCsv(month) {
    const res = await api('GET', `/api/export?month=${month}`);
    return res.blob();
  }

  async function connect(newKey) {
    const old = key;
    key = newKey.trim();
    try {
      await api('GET', '/api/ping');
      try { localStorage.setItem(LS.key, key); } catch { /* ignore */ }
      return { ok: true };
    } catch (err) {
      key = old;
      return { ok: false, message: err.status === 401 ? 'That key doesn’t match the server’s key.' : err.message };
    }
  }

  window.addEventListener('online', () => { flush().then(() => onChange?.()); });

  return {
    get key() { return key; },
    get online() { return online; },
    get pending() { return outbox.length; },
    get unsorted() { return cache.unsorted; },
    get index() { return cache.index; },
    find(id) { const hit = findPayment(id); return hit ? hit.list[hit.index] : null; },
    monthData, budgetsFor, refresh, flush, connect, exportCsv,
    addPayment, updatePayment, deletePayment, restorePayment, saveBudgets,
  };
}

function normalizeBudgets(b) {
  const out = {};
  for (const [k, v] of Object.entries(b)) out[k] = v === '' || v == null || Number(v) === 0 ? null : Number(v);
  return out;
}
