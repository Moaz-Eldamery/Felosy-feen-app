import {
  CATEGORIES, CAT, METHODS, METHOD, monthKey, monthLabel, shiftMonth, summarize, money, round2,
  toCairoInput, fromCairoInput, dayKey, dayLabel, timeLabel, shortDateTime,
} from './model.js';
import { icon } from './icons.js';
import { createStore } from './store.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const egp = (n, exact = false) => `EGP ${money(n, { exact })}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const ui = {
  screen: 'home',
  historyMonth: monthKey(),
  filter: 'all',
  sheet: null,
  hiddenAt: 0,
};

const store = createStore({
  onChange: () => render(),
  onError: (msg) => toast(msg, { error: true }),
  onAuth: () => { toast('The server rejected the saved key. Connect again.', { error: true }); showConnect(); },
});

// ====================================================================== boot

const app = $('#app');

function boot() {
  if (!store.key) return showConnect();
  app.innerHTML = `
    <div class="stage" id="stage">
      <section class="screen" id="home" data-pos="center" aria-label="Overview">
        <header class="navbar" id="home-nav">
          <div class="nav-left"><button class="bar-btn" data-act="open-history">${icon('history')}History</button></div>
          <div class="nav-title" id="home-nav-title"></div>
          <div class="nav-right"><button class="bar-btn" data-act="open-settings" aria-label="Settings and budgets">${icon('settings')}</button></div>
        </header>
        <main class="scroll" id="home-scroll"></main>
        <footer class="toolbar">
          <div id="sync-note"></div>
          <button class="btn btn-primary" data-act="add">${icon('plus')}Add Payment</button>
        </footer>
      </section>
      <section class="screen" id="history" data-pos="right" hidden aria-label="History">
        <header class="navbar always" id="history-nav">
          <div class="nav-left"><button class="bar-btn back" data-act="back">${icon('back')}Overview</button></div>
          <div class="nav-title">History</div>
          <div class="nav-right"><button class="bar-btn" data-act="export" aria-label="Export as CSV">${icon('share')}</button></div>
        </header>
        <main class="scroll" id="history-scroll"></main>
      </section>
    </div>
    <div class="scrim" id="scrim" data-act="sheet-dismiss"></div>
    <div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"></div>
    <div class="as-scrim" id="as-scrim" data-act="as-cancel"></div>
    <div class="action-sheet" id="action-sheet" role="dialog" aria-modal="true" aria-label="Export"></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  $('#home-scroll').addEventListener('scroll', (e) => {
    $('#home-nav').classList.toggle('scrolled', e.target.scrollTop > 44);
  }, { passive: true });

  render();
  openEntrySheet();
  store.refresh(monthKey()).then(() => {
    // Apple Pay payments arrived while we were loading: show them first.
    const s = ui.sheet;
    if (s?.kind === 'pay' && s.mode === 'add' && !s.amount && !s.category && store.unsorted.length) openEntrySheet();
  });
}

function openEntrySheet() {
  if (store.unsorted.length) openPaySheet({ mode: 'sort', id: store.unsorted[0].id });
  else openPaySheet({ mode: 'add' });
}

// Re-opening the app after a while counts as "opening" it: show Add Payment again.
document.addEventListener('visibilitychange', () => {
  if (!store.key || !$('#stage')) return;
  if (document.hidden) { ui.hiddenAt = Date.now(); return; }
  if (Date.now() - ui.hiddenAt > 60_000) {
    if (!ui.sheet) openEntrySheet();
    store.refresh(monthKey()).then(() => {
      const s = ui.sheet;
      if (s?.kind === 'pay' && s.mode === 'add' && !s.amount && !s.category && store.unsorted.length) openEntrySheet();
    });
  }
});

// ====================================================================== render

function render() {
  if (!$('#stage')) return;
  renderHome();
  if (ui.screen === 'history') renderHistory();
  const s = ui.sheet;
  if (s?.kind === 'pay' && s.mode === 'sort') {
    if (!store.unsorted.some((p) => p.id === s.id)) {
      if (store.unsorted.length) openPaySheet({ mode: 'sort', id: store.unsorted[0].id }, { keepOpen: true });
      else openPaySheet({ mode: 'add' }, { keepOpen: true });
    } else renderSheet();
  } else if (s?.kind === 'pay' && s.mode === 'add') {
    patchSheetHead();
  } else if (s?.kind === 'settings') {
    patchSyncStatus();
  }
}

function syncNoteHTML() {
  if (store.pending) {
    return `<p class="sync-note">${icon('cloudOff')}${plural(store.pending, 'change')} saved on this iPhone · will sync when online</p>`;
  }
  if (!store.online) return `<p class="sync-note">${icon('cloudOff')}Offline · showing saved data</p>`;
  return '';
}

// ---------- home ----------

function renderHome() {
  const month = monthKey();
  const data = store.monthData(month);
  const sum = summarize({ month, payments: data?.payments || [], budgets: store.budgetsFor(month) });
  $('#home-nav-title').textContent = monthLabel(month, { year: false });
  $('#sync-note').innerHTML = syncNoteHTML();

  const year = month.slice(0, 4);
  const sub = sum.daysLeft === 0 ? `${year} · Last day of the month` : `${year} · ${plural(sum.daysLeft, 'day')} left`;

  $('#home-scroll').innerHTML = `
    <h1 class="large-title">${monthLabel(month, { year: false })}</h1>
    <p class="title-sub">${sub}</p>
    ${alertsHTML(sum)}
    <div class="total-block">
      <p class="total-label">Spent this month</p>
      <p class="total"><span class="cur">EGP</span>${money(sum.total, { exact: true })}</p>
      <p class="total-sub">${budgetLineHTML(sum)}</p>
    </div>
    ${chartHTML(sum)}
    <h2 class="group-header big">Categories</h2>
    <ul class="group">${sum.rows.map(catRowHTML).join('')}</ul>
    <p class="group-footer">Budgets repeat every month. Tap a category to see its payments.</p>
    ${!data && !store.online ? '<p class="empty">Couldn’t load this month. Check your connection.</p>' : ''}`;
}

function budgetLineHTML(sum) {
  if (!sum.budgetTotal) return 'No budgets set yet · <button class="btn-plain" style="min-height:0;display:inline" data-act="open-settings">Set budgets</button>';
  const left = round2(sum.budgetTotal - sum.total);
  if (left < 0) return `<span class="v-over">${egp(-left)} over</span> your ${egp(sum.budgetTotal)} budget`;
  return `of ${egp(sum.budgetTotal)} budget · <b>${egp(left)} left</b>`;
}

function alertsHTML(sum) {
  const rows = [];
  const n = store.unsorted.length;
  if (n) {
    const total = store.unsorted.reduce((s, p) => s + p.amount, 0);
    rows.push(`<li><button class="row has-tile alert-row" data-act="sort">
      <span class="tile t-tint">${icon('wallet')}</span>
      <span class="row-main" style="gap:2px"><span class="row-title">${plural(n, 'Apple Pay payment')} to sort</span>
      <span class="row-sub">${egp(total, true)} · tap to pick categories</span></span>${icon('next', 'chev')}</button></li>`);
  }
  for (const r of sum.alerts) {
    const over = r.state === 'over';
    rows.push(`<li><button class="row has-tile alert-row" data-act="filter" data-cat="${r.id}">
      <span class="tile ${over ? 't-red' : 't-amber'}">${icon('alert')}</span>
      <span class="row-main" style="gap:2px">
        <span class="row-title">${esc(r.label)} ${over ? 'is over budget' : `is at ${Math.floor(r.ratio * 100)}%`}</span>
        <span class="row-sub">${money(r.spent)} of ${money(r.budget)} · ${over
          ? `<span class="v-over">${egp(r.over)} over</span>`
          : `${egp(r.budget - r.spent)} left`}</span>
      </span>${icon('next', 'chev')}</button></li>`);
  }
  if (!rows.length) return '';
  return `<ul class="group alerts" aria-label="Warnings">${rows.join('')}</ul>`;
}

function catRowHTML(r) {
  const cls = r.state === 'over' ? 'v-over' : r.state === 'near' ? 'v-near' : '';
  const value = r.budget
    ? `<b class="${cls}" style="font-weight:${cls ? 600 : 500}">${money(r.spent)}</b> <span class="of">/ ${money(r.budget)}</span>`
    : `<span style="font-weight:500">${money(r.spent)}</span> <span class="of">· No limit</span>`;
  const width = r.budget ? Math.min(100, (r.spent / r.budget) * 100) : 0;
  const meter = r.budget
    ? `<span class="meter ${r.state}" style="--tile:var(--c-${r.color})" role="progressbar" aria-label="${esc(r.label)} budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round((r.spent / r.budget) * 100)}"><span style="width:${width}%"></span></span>`
    : '';
  return `<li><button class="row has-tile cat-row" data-act="filter" data-cat="${r.id}">
    <span class="tile t-${r.color}">${icon(r.icon)}</span>
    <span class="row-main"><span class="row-line"><span class="row-title">${esc(r.label)}</span><span class="row-value">${value}</span></span>${meter}</span>
    ${icon('next', 'chev')}</button></li>`;
}

function niceMax(v) {
  if (v <= 0) return 1000;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (step * mag >= v) return step * mag;
  return 10 * mag;
}
const compact = (n) => (n >= 1000 ? `${round2(n / 1000).toString().replace(/\.0+$/, '')}K` : String(Math.round(n)));

function chartHTML(sum) {
  const { days, asOf, cumulative, budgetTotal, paceToday, total } = sum;
  const maxY = niceMax(Math.max(budgetTotal, total, 1) * 1.04);
  const x = (d) => (d / days) * 100;
  const y = (v) => 100 - (v / maxY) * 100;
  const pts = [];
  for (let d = 0; d <= asOf; d++) pts.push(`${x(d).toFixed(2)},${y(cumulative[d]).toFixed(2)}`);
  const line = pts.length > 1 ? `M${pts.join(' L')}` : '';
  const area = pts.length > 1 ? `${line} L${x(asOf).toFixed(2)},100 L0,100 Z` : '';

  let status = '<span class="chart-status">No budget set</span>';
  if (budgetTotal) {
    const diff = round2(total - paceToday);
    if (total > budgetTotal) status = `<span class="chart-status over">${egp(total - budgetTotal)} over budget</span>`;
    else if (diff > 0.5) status = `<span class="chart-status ahead">${egp(diff)} above pace</span>`;
    else status = `<span class="chart-status">${egp(-diff)} under pace</span>`;
  }

  const ticks = [0, maxY / 2, maxY];
  const xTicks = [1, 8, 15, 22, days].filter((d, i, a) => a.indexOf(d) === i && (d === days || days - d >= 4));
  const label = budgetTotal
    ? `Spent ${egp(total)} by day ${asOf}; the on-track amount for today is ${egp(paceToday)}.`
    : `Spent ${egp(total)} by day ${asOf}.`;
  const dot = asOf > 0
    ? `<span class="dot" style="left:${x(asOf)}%;top:${y(cumulative[asOf])}%"></span>` : '';

  return `<section class="group chart-card" aria-labelledby="chart-title">
    <div class="chart-head"><h2 class="chart-title" id="chart-title">Spending pace</h2>${status}</div>
    <div class="chart" role="img" aria-label="${esc(label)}">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <g class="grid">${ticks.map((t) => `<line x1="0" x2="100" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>
        ${budgetTotal ? `<line class="pace" x1="0" y1="100" x2="100" y2="${y(budgetTotal)}"/>` : ''}
        ${area ? `<path class="area" d="${area}"/><path class="line" d="${line}"/>` : ''}
      </svg>
      ${dot}
      ${ticks.map((t) => `<span class="ylab" style="top:${y(t)}%">${compact(t)}</span>`).join('')}
      ${xTicks.map((d) => `<span class="xlab" style="left:${x(d - 1)}%">${d === 1 ? monthLabel(sum.month, { year: false }).slice(0, 3) + ' 1' : d}</span>`).join('')}
    </div>
    <div class="chart-legend"><span><i></i>You</span>${budgetTotal ? '<span><i class="dash"></i>On track for budget</span>' : ''}</div>
  </section>`;
}

// ---------- history ----------

function renderHistory() {
  const month = ui.historyMonth;
  const current = monthKey();
  const data = store.monthData(month);
  const payments = data?.payments || [];
  const sum = summarize({ month, payments, budgets: store.budgetsFor(month) }, current);
  const earliest = [...store.index.map((i) => i.month), current].sort()[0];
  const filtered = ui.filter === 'all' ? payments : payments.filter((p) => p.category === ui.filter);

  const counts = {};
  for (const p of payments) counts[p.category] = (counts[p.category] || 0) + 1;

  const chips = [`<button class="chip" data-act="chip" data-cat="all" aria-pressed="${ui.filter === 'all'}">All <span class="count">${payments.length}</span></button>`]
    .concat(CATEGORIES.map((c) => `<button class="chip" data-act="chip" data-cat="${c.id}" aria-pressed="${ui.filter === c.id}" style="--tile:var(--c-${c.color})"><span class="swatch"></span>${c.short} <span class="count">${counts[c.id] || 0}</span></button>`))
    .join('');

  let body;
  if (!data) {
    body = `<p class="empty">${store.online ? `Loading ${monthLabel(month)}…` : 'This month isn’t saved on this iPhone yet. Connect to the internet to load it.'}</p>`;
  } else if (!filtered.length) {
    const what = ui.filter === 'all' ? 'No payments' : `No ${CAT[ui.filter].label} payments`;
    body = `<div class="empty"><strong>${what}</strong>in ${monthLabel(month)}.</div>`;
  } else {
    const days = new Map();
    for (const p of filtered) {
      const k = dayKey(p.paid_at);
      if (!days.has(k)) days.set(k, []);
      days.get(k).push(p);
    }
    body = [...days].map(([k, list]) => `
      <h3 class="group-header day-head"><span>${dayLabel(k)}</span><span class="num">${egp(list.reduce((s, p) => s + p.amount, 0), true)}</span></h3>
      <ul class="group">${list.map(payRowHTML).join('')}</ul>`).join('');
  }

  const sel = ui.filter !== 'all' ? sum.rows.find((r) => r.id === ui.filter) : null;
  const summary = sel
    ? `<p class="total-label">${esc(sel.label)}</p>
       <p class="total"><span class="cur">EGP</span>${money(sel.spent, { exact: true })}</p>
       <p class="total-sub">${sel.budget
        ? (sel.state === 'over' ? `<span class="v-over">${egp(sel.over)} over</span> its ${egp(sel.budget)} budget` : `of ${egp(sel.budget)} budget · <b>${egp(sel.budget - sel.spent)} left</b>`)
        : 'No budget limit'}</p>`
    : `<p class="total-label">${sum.isCurrent ? 'Spent so far' : 'Spent in total'}</p>
       <p class="total"><span class="cur">EGP</span>${money(sum.total, { exact: true })}</p>
       <p class="total-sub">${budgetLineHTML(sum)}</p>`;

  $('#history-scroll').innerHTML = `
    <div class="month-switch">
      <button class="bar-btn" data-act="month-prev" aria-label="Previous month" ${month <= earliest ? 'disabled' : ''}>${icon('back')}</button>
      <h2>${monthLabel(month)}</h2>
      <button class="bar-btn" data-act="month-next" aria-label="Next month" ${month >= current ? 'disabled' : ''}>${icon('next')}</button>
    </div>
    <div class="total-block" style="margin-top:8px">${summary}</div>
    <div class="chips" role="toolbar" aria-label="Filter by category">${chips}</div>
    ${ui.filter === 'all' && data && payments.length ? `<h3 class="group-header">By category</h3><ul class="group">${sum.rows.filter((r) => r.spent || r.budget).map(catRowHTML).join('')}</ul>` : ''}
    ${body}`;
}

function payRowHTML(p) {
  const c = CAT[p.category] || CAT.others;
  const title = p.note || c.label;
  const bits = [timeLabel(p.paid_at), METHOD[p.method]?.label || p.method];
  if (p.note) bits.push(c.short);
  return `<li><button class="row has-tile pay-row" data-act="edit" data-id="${p.id}">
    <span class="tile t-${c.color}">${icon(c.icon)}</span>
    <span class="row-main" style="gap:2px">
      <span class="row-line"><span class="row-title">${esc(title)}</span><span class="row-value">${egp(p.amount, true)}</span></span>
      <span class="row-sub">${esc(bits.join(' · '))}${p.edited ? '<span class="tag">Edited</span>' : ''}</span>
    </span></button></li>`;
}

// ====================================================================== navigation

function openHistory(filter = 'all', month = monthKey()) {
  ui.filter = filter;
  ui.historyMonth = month;
  ui.screen = 'history';
  const h = $('#history');
  h.hidden = false;
  renderHistory();
  $('#history-scroll').scrollTop = 0;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    h.dataset.pos = 'center';
    $('#home').dataset.pos = 'left';
  }));
  if (!store.monthData(month) || month === monthKey()) store.refresh(month);
}

function closeHistory() {
  ui.screen = 'home';
  const h = $('#history');
  h.dataset.pos = 'right';
  $('#home').dataset.pos = 'center';
  h.addEventListener('transitionend', () => { if (ui.screen === 'home') h.hidden = true; }, { once: true });
}

function setHistoryMonth(m) {
  ui.historyMonth = m;
  renderHistory();
  if (!store.monthData(m)) store.refresh(m).then(renderHistory);
}

// Left-edge swipe back, as on any iOS navigation stack.
(function edgeSwipe() {
  let start = null;
  document.addEventListener('touchstart', (e) => {
    if (ui.screen !== 'history' || ui.sheet) return;
    const t = e.touches[0];
    if (t.clientX > 24) return;
    start = { x: t.clientX, y: t.clientY, w: window.innerWidth, moved: false };
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!start) return;
    const t = e.touches[0];
    const dx = Math.max(0, t.clientX - start.x);
    if (!start.moved && Math.abs(t.clientY - start.y) > dx) { start = null; return; }
    start.moved = true;
    start.dx = dx;
    const h = $('#history'); const home = $('#home');
    h.classList.add('dragging'); home.classList.add('dragging');
    h.style.transform = `translateX(${dx}px)`;
    home.style.transform = `translateX(${-28 + (dx / start.w) * 28}%)`;
  }, { passive: true });
  document.addEventListener('touchend', () => {
    if (!start) return;
    const h = $('#history'); const home = $('#home');
    h.classList.remove('dragging'); home.classList.remove('dragging');
    h.style.transform = ''; home.style.transform = '';
    if (start.moved && start.dx > start.w * 0.33) closeHistory();
    start = null;
  });
})();

// ====================================================================== payment sheet

function lastMethod() {
  try { return localStorage.getItem('spending.method') || 'card'; } catch { return 'card'; }
}

function openPaySheet({ mode, id }, { keepOpen = false } = {}) {
  let f = { kind: 'pay', mode, id, amount: '', category: null, method: lastMethod(), note: '', date: toCairoInput(), error: '' };
  if (mode === 'edit' || mode === 'sort') {
    const p = findAny(id);
    if (!p) return;
    f = {
      ...f,
      amount: String(p.amount),
      category: p.category,
      method: p.method,
      note: p.note,
      date: toCairoInput(new Date(p.paid_at)),
      original: p,
    };
  }
  ui.sheet = f;
  renderSheet();
  if (!keepOpen) showSheet();
}

function findAny(id) {
  const p = store.find(id);
  return p ? { ...p } : null;
}

function showSheet() {
  document.body.classList.add('sheet-open');
  $('#stage').inert = true;
  $('#sheet').style.removeProperty('--drag');
  setTimeout(() => $('#sheet-title')?.focus({ preventScroll: true }), 50);
}

function closeSheet() {
  document.body.classList.remove('sheet-open');
  $('#stage').inert = false;
  ui.sheet = null;
}

function amountDisplay(str) {
  if (!str) return '0';
  const [int, frac] = str.split('.');
  const i = Number(int || 0).toLocaleString('en-US');
  return frac !== undefined ? `${i}.${frac}` : i;
}

function renderSheet() {
  const f = ui.sheet;
  const el = $('#sheet');
  if (!f) return;
  if (f.kind === 'settings') { el.innerHTML = settingsHTML(); return; }
  if (f.mode === 'sort') { el.innerHTML = sortHTML(f); return; }

  const isEdit = f.mode === 'edit';
  const sorting = isEdit && f.original && !f.original.category;
  const title = sorting ? 'Sort Payment' : isEdit ? 'Edit Payment' : 'New Payment';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];
  el.innerHTML = `
    <div class="grabber" aria-hidden="true"></div>
    <header class="sheet-head" data-drag>
      <div class="nav-left"><button class="bar-btn" data-act="sheet-cancel">Cancel</button></div>
      <h2 id="sheet-title" tabindex="-1">${title}</h2>
      <div class="nav-right" id="sheet-head-right">${headRightHTML(f)}</div>
    </header>
    <div class="sheet-body">
      <div class="amount">
        <div class="amount-value" id="amount-value" aria-live="polite" aria-label="Amount"></div>
        <p class="amount-hint" id="amount-hint"></p>
      </div>
      <div class="cat-grid" id="cat-grid" role="radiogroup" aria-label="Category">
        ${CATEGORIES.map((c) => `<button class="cat-pick" role="radio" data-act="pick" data-cat="${c.id}" style="--tile:var(--c-${c.color})"><span class="disc">${icon(c.icon)}</span>${c.short}</button>`).join('')}
      </div>
      <ul class="group details">
        <li><div class="row"><span class="row-label" id="method-label">Paid with</span>
          <div class="segmented" role="radiogroup" aria-labelledby="method-label" id="method-seg">
            ${METHODS.map((m) => `<button role="radio" data-act="method" data-method="${m.id}">${m.label}</button>`).join('')}
          </div></div></li>
        <li><label class="row"><span class="row-label">Date</span>
          <input type="datetime-local" data-field="date" value="${esc(f.date)}" required></label></li>
        <li><label class="row"><span class="row-label">Note</span>
          <input type="text" data-field="note" value="${esc(f.note)}" placeholder="Merchant or note (optional)" maxlength="80" enterkeyhint="done" autocomplete="off"></label></li>
      </ul>
      <div class="keypad" aria-label="Amount keypad">
        ${keys.map((k) => `<button class="key" data-act="key" data-key="${k}" aria-label="${k === 'back' ? 'Delete digit' : k === '.' ? 'Decimal point' : k}">${k === 'back' ? icon('backspace') : k}</button>`).join('')}
      </div>
      <button class="btn btn-primary confirm" data-act="confirm" id="confirm"></button>
    </div>`;
  patchForm();
}

function headRightHTML(f) {
  if (f.mode === 'edit') return `<button class="bar-btn danger" data-act="delete" aria-label="Delete payment">${icon('trash')}</button>`;
  const n = store.unsorted.length;
  return n ? `<button class="bar-btn" data-act="sort">Sort ${n}</button>` : '';
}

function patchSheetHead() {
  const el = $('#sheet-head-right');
  if (el && ui.sheet) el.innerHTML = headRightHTML(ui.sheet);
}

function patchForm() {
  const f = ui.sheet;
  const value = $('#amount-value');
  if (!value) return;
  value.classList.toggle('empty-amount', !f.amount);
  value.innerHTML = `<span class="cur">EGP</span><span class="digits num">${amountDisplay(f.amount)}</span><span class="caret" aria-hidden="true"></span>`;
  // Shrink very long amounts so they never clip.
  value.style.fontSize = f.amount.length > 9 ? '2.4rem' : '';

  const hint = $('#amount-hint');
  hint.classList.toggle('err', !!f.error);
  hint.textContent = f.error || (f.category ? CAT[f.category].label : 'Choose a category');

  const grid = $('#cat-grid');
  grid.classList.toggle('has-choice', !!f.category);
  for (const b of grid.children) b.setAttribute('aria-checked', String(b.dataset.cat === f.category));
  for (const b of $('#method-seg').children) b.setAttribute('aria-checked', String(b.dataset.method === f.method));

  const amount = Number(f.amount);
  const ready = amount > 0 && !!f.category;
  const btn = $('#confirm');
  btn.disabled = !ready;
  if (f.mode === 'edit') btn.textContent = f.original && !f.original.category ? 'File Payment' : 'Save Changes';
  else btn.textContent = ready ? `Add ${egp(amount, true)} to ${CAT[f.category].short}` : 'Add Payment';
}

function pressKey(k) {
  const f = ui.sheet;
  let a = f.amount;
  if (k === 'back') a = a.slice(0, -1);
  else if (k === '.') { if (!a.includes('.')) a = (a || '0') + '.'; }
  else {
    const [int, frac] = a.split('.');
    if (frac !== undefined && frac.length >= 2) return nudge();
    if (frac === undefined && int.replace(/^0+/, '').length >= 7) return nudge();
    a = a === '0' ? k : a + k;
  }
  f.amount = a;
  f.error = '';
  patchForm();
}

function nudge() {
  const v = $('#amount-value');
  v?.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 220 });
}

function confirmPayment() {
  const f = ui.sheet;
  const amount = round2(Number(f.amount));
  if (!(amount > 0)) { f.error = 'Enter an amount first.'; return patchForm(); }
  if (!f.category) { f.error = 'Pick a category.'; return patchForm(); }
  const when = fromCairoInput(f.date);
  if (!when) { f.error = 'Pick a valid date and time.'; return patchForm(); }
  if (f.mode === 'add') {
    try { localStorage.setItem('spending.method', f.method); } catch { /* ignore */ }
    const p = store.addPayment({ amount, category: f.category, method: f.method, note: f.note, paid_at: when.toISOString() });
    closeSheet();
    toast(`Added ${egp(amount, true)} to ${CAT[f.category].label}`, { action: 'Undo', onAction: () => store.deletePayment(p.id) });
    return;
  }
  const o = f.original;
  const patch = {};
  if (amount !== o.amount) patch.amount = amount;
  if (f.category !== o.category) patch.category = f.category;
  if (f.method !== o.method) patch.method = f.method;
  if ((f.note || '').trim() !== (o.note || '')) patch.note = f.note.trim();
  if (when.toISOString().slice(0, 16) !== new Date(o.paid_at).toISOString().slice(0, 16)) patch.paid_at = when.toISOString();
  const wasUnsorted = !o.category;
  if (Object.keys(patch).length) store.updatePayment(o.id, patch);
  if (wasUnsorted && store.unsorted.length) {
    openPaySheet({ mode: 'sort', id: store.unsorted[0].id }, { keepOpen: true });
  } else closeSheet();
  toast(wasUnsorted ? `Filed in ${CAT[f.category].label}` : 'Changes saved');
}

function deleteFromSheet() {
  const f = ui.sheet;
  const id = f.id;
  store.deletePayment(id);
  if (f.mode === 'sort' && store.unsorted.length) openPaySheet({ mode: 'sort', id: store.unsorted[0].id }, { keepOpen: true });
  else closeSheet();
  toast('Payment deleted', { action: 'Undo', onAction: () => store.restorePayment(id) });
}

// ---------- sort mode (Apple Pay payments waiting for a category) ----------

function sortHTML(f) {
  const p = f.original;
  const n = store.unsorted.length;
  const idx = Math.max(0, store.unsorted.findIndex((u) => u.id === p.id)) + 1;
  return `
    <div class="grabber" aria-hidden="true"></div>
    <header class="sheet-head" data-drag>
      <div class="nav-left"><button class="bar-btn" data-act="sheet-cancel">Later</button></div>
      <h2 id="sheet-title" tabindex="-1">Sort Payment${n > 1 ? `<small>${idx} of ${n}</small>` : ''}</h2>
      <div class="nav-right"><button class="bar-btn" data-act="sort-edit">Edit</button></div>
    </header>
    <div class="sheet-body">
      <div class="amount"><div class="amount-value"><span class="cur">EGP</span><span class="digits num">${money(p.amount, { exact: true })}</span></div></div>
      <div class="sort-meta">
        <p class="sort-merchant">${esc(p.note || 'Apple Pay payment')}</p>
        <p class="sort-when">${esc(shortDateTime(p.paid_at))} · ${METHOD[p.method]?.label || 'Apple Pay'}</p>
      </div>
      <p class="sort-prompt">Tap a category to file it</p>
      <div class="cat-grid big" role="group" aria-label="File in category">
        ${CATEGORIES.map((c) => `<button class="cat-pick" data-act="file" data-cat="${c.id}" style="--tile:var(--c-${c.color})"><span class="disc">${icon(c.icon)}</span>${c.short}</button>`).join('')}
      </div>
      <div class="sort-actions">
        <button class="btn btn-danger" style="width:auto" data-act="delete">Delete</button>
        <button class="btn btn-plain" style="width:auto" data-act="add-instead">New payment instead</button>
      </div>
    </div>`;
}

function filePayment(cat) {
  const p = ui.sheet.original;
  store.updatePayment(p.id, { category: cat });
  toast(`Filed ${egp(p.amount, true)} in ${CAT[cat].label}`, {
    action: 'Undo',
    onAction: () => { store.updatePayment(p.id, { category: null }); openPaySheet({ mode: 'sort', id: p.id }, { keepOpen: !!ui.sheet }); showSheet(); },
  });
  // render() moves the sheet on to the next unsorted payment (or a blank one).
}

// ====================================================================== settings sheet

function openSettings() {
  ui.sheet = { kind: 'settings' };
  renderSheet();
  showSheet();
}

function settingsHTML() {
  const month = monthKey();
  const b = store.budgetsFor(month);
  const total = CATEGORIES.reduce((s, c) => s + (b[c.id] || 0), 0);
  const url = `${location.origin}/api/capture`;
  return `
    <div class="grabber" aria-hidden="true"></div>
    <header class="sheet-head" data-drag>
      <div class="nav-left"></div>
      <h2 id="sheet-title" tabindex="-1">Settings</h2>
      <div class="nav-right"><button class="bar-btn strong" data-act="settings-done">Done</button></div>
    </header>
    <div class="sheet-body">
      <h3 class="group-header" style="margin-top:8px">Monthly budgets · EGP</h3>
      <ul class="group">
        ${CATEGORIES.map((c) => `<li><label class="row has-tile">
          <span class="tile t-${c.color}">${icon(c.icon)}</span>
          <span class="row-title" style="flex:none">${c.label}</span>
          <input class="budget-input" data-budget="${c.id}" inputmode="decimal" placeholder="No limit" value="${b[c.id] ?? ''}" aria-label="${c.label} monthly budget in EGP">
        </label></li>`).join('')}
        <li><div class="row"><span class="row-title" style="font-weight:600;flex:1">Total</span><span class="row-value" id="budget-total">${egp(total)}</span></div></li>
      </ul>
      <p class="group-footer">Budgets repeat every month. Changes apply from ${monthLabel(month)} onward; earlier months keep the budgets they had. Leave a budget empty for no limit. You’ll see a warning at 80% and when you go over.</p>

      <h3 class="group-header">Apple Pay automation</h3>
      <ul class="group">
        <li><div class="row"><span class="row-main" style="gap:2px"><span class="row-title">Capture URL</span><span class="code">${esc(url)}</span></span>
          <button class="copy-btn" data-act="copy" data-copy="${esc(url)}">${icon('copy')}Copy</button></div></li>
        <li><div class="row"><span class="row-main" style="gap:2px"><span class="row-title">Secret key</span><span class="code">•••••••• ${esc(store.key.slice(-4))}</span></span>
          <button class="copy-btn" data-act="copy" data-copy-key>${icon('copy')}Copy</button></div></li>
        <li><ol class="steps">
          <li>Open <b>Shortcuts</b> › <b>Automation</b> › <b>+</b> › <b>Wallet</b>. Choose your cards, then <b>Run Immediately</b>.</li>
          <li>Tap <b>Create New Shortcut</b> and add <b>Get Contents of URL</b>. Paste the Capture URL.</li>
          <li>Set <b>Method</b> to <b>POST</b> and <b>Request Body</b> to <b>JSON</b> with three fields: <b>amount</b> = Shortcut Input › Amount, <b>merchant</b> = Shortcut Input › Merchant, <b>key</b> = your secret key.</li>
          <li>Optional: add <b>Show Notification</b> — “Open Spending to sort it”.</li>
        </ol></li>
      </ul>
      <p class="group-footer">Each Apple Pay tap lands here as an unsorted payment. Next time you open the app, you pick its category with one tap.</p>

      <h3 class="group-header">Data</h3>
      <ul class="group">
        <li><div class="row" id="sync-row">${syncRowHTML()}</div></li>
        <li><button class="row" data-act="export-all"><span class="row-title" style="color:var(--tint)">Export all payments (CSV)</span></button></li>
        <li><button class="row" data-act="disconnect"><span class="row-title" style="color:var(--red-text)">Forget key on this iPhone</span></button></li>
      </ul>
      <p class="group-footer">Your payments live in your own Cloudflare database. Forgetting the key doesn’t delete anything.</p>
    </div>`;
}

function syncRowHTML() {
  const state = store.pending ? `${plural(store.pending, 'change')} waiting to sync` : store.online ? 'All changes saved' : 'Offline';
  return `<span class="status-dot ${store.online && !store.pending ? '' : 'off'}"></span><span class="row-title" style="flex:1">${store.online ? 'Connected' : 'Offline'}</span><span class="row-value of">${state}</span>`;
}

function patchSyncStatus() {
  const el = $('#sync-row');
  if (el) el.innerHTML = syncRowHTML();
}

function readBudgetInputs() {
  const out = {};
  let bad = null;
  for (const input of document.querySelectorAll('[data-budget]')) {
    const v = input.value.replace(/[,\s]/g, '');
    if (v === '') { out[input.dataset.budget] = null; continue; }
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) { bad = input; continue; }
    out[input.dataset.budget] = n === 0 ? null : round2(n);
  }
  return { out, bad };
}

function settingsDone() {
  const { out, bad } = readBudgetInputs();
  if (bad) { bad.focus(); toast('Budgets must be numbers, like 1500.', { error: true }); return; }
  const current = store.budgetsFor(monthKey());
  const changed = CATEGORIES.some((c) => (current[c.id] ?? null) !== (out[c.id] ?? null));
  if (changed) { store.saveBudgets(out); toast('Budgets saved'); }
  closeSheet();
}

// ====================================================================== export

function openActionSheet(title, actions) {
  const el = $('#action-sheet');
  el.innerHTML = `<div class="group"><div class="as-title">${esc(title)}</div>
    ${actions.map((a, i) => `<button class="as-btn" data-as="${i}">${esc(a.label)}</button>`).join('')}</div>
    <button class="as-btn as-cancel" data-act="as-cancel">Cancel</button>`;
  el._actions = actions;
  el.classList.add('open');
  $('#as-scrim').classList.add('open');
}
function closeActionSheet() {
  $('#action-sheet').classList.remove('open');
  $('#as-scrim').classList.remove('open');
}

async function exportCsv(month) {
  try {
    const blob = await store.exportCsv(month);
    const name = `spending-${month}.csv`;
    const file = new File([blob], name, { type: 'text/csv' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name }).catch(() => {});
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  } catch (err) {
    toast(err.status === 0 ? 'Export needs an internet connection.' : err.message, { error: true });
  }
}

// ====================================================================== toast

let toastTimer;
function toast(message, { action, onAction, error = false } = {}) {
  const el = $('#toast');
  if (!el) return;
  el.classList.toggle('error', error);
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button class="toast-action">${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { hideToast(); onAction?.(); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 5000 : 2600);
}
function hideToast() { $('#toast')?.classList.remove('show'); }

// ====================================================================== events

document.addEventListener('click', (e) => {
  const asBtn = e.target.closest('[data-as]');
  if (asBtn) {
    const a = $('#action-sheet')._actions[+asBtn.dataset.as];
    closeActionSheet();
    a?.run();
    return;
  }
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const act = t.dataset.act;
  const f = ui.sheet;
  switch (act) {
    case 'add': openPaySheet({ mode: 'add' }); break;
    case 'sort':
      if (store.unsorted.length) {
        openPaySheet({ mode: 'sort', id: store.unsorted[0].id }, { keepOpen: true });
        showSheet();
      }
      break;
    case 'open-history': openHistory(); break;
    case 'open-settings': openSettings(); break;
    case 'back': closeHistory(); break;
    case 'filter': openHistory(t.dataset.cat, ui.screen === 'history' ? ui.historyMonth : monthKey()); break;
    case 'chip': ui.filter = t.dataset.cat; renderHistory(); break;
    case 'month-prev': setHistoryMonth(shiftMonth(ui.historyMonth, -1)); break;
    case 'month-next': setHistoryMonth(shiftMonth(ui.historyMonth, 1)); break;
    case 'edit': openPaySheet({ mode: 'edit', id: t.dataset.id }); break;
    case 'sheet-cancel': case 'sheet-dismiss': closeSheet(); break;
    case 'key': pressKey(t.dataset.key); break;
    case 'pick': f.category = t.dataset.cat; f.error = ''; patchForm(); break;
    case 'method': f.method = t.dataset.method; patchForm(); break;
    case 'confirm': confirmPayment(); break;
    case 'delete': deleteFromSheet(); break;
    case 'file': filePayment(t.dataset.cat); break;
    case 'sort-edit': openPaySheet({ mode: 'edit', id: f.id }, { keepOpen: true }); break;
    case 'add-instead': openPaySheet({ mode: 'add' }, { keepOpen: true }); break;
    case 'settings-done': settingsDone(); break;
    case 'copy': {
      const text = 'copyKey' in t.dataset ? store.key : t.dataset.copy;
      navigator.clipboard?.writeText(text).then(() => toast('Copied'), () => toast('Couldn’t copy. Select it manually.', { error: true }));
      break;
    }
    case 'export': {
      const m = ui.historyMonth;
      openActionSheet('Export payments as a spreadsheet (CSV)', [
        { label: `${monthLabel(m)} only`, run: () => exportCsv(m) },
        { label: 'All months', run: () => exportCsv('all') },
      ]);
      break;
    }
    case 'export-all': exportCsv('all'); break;
    case 'as-cancel': closeActionSheet(); break;
    case 'disconnect':
      try { localStorage.removeItem('spending.key'); } catch { /* ignore */ }
      location.reload();
      break;
    default: break;
  }
});

document.addEventListener('input', (e) => {
  const f = ui.sheet;
  if (!f) return;
  const field = e.target.dataset.field;
  if (field && f.kind === 'pay') { f[field] = e.target.value; f.error = ''; }
  if (e.target.dataset.budget !== undefined) {
    const { out } = readBudgetInputs();
    const total = Object.values(out).reduce((s, v) => s + (v || 0), 0);
    $('#budget-total').textContent = egp(total);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if ($('#action-sheet')?.classList.contains('open')) return closeActionSheet();
    if (ui.sheet) return closeSheet();
    if (ui.screen === 'history') return closeHistory();
  }
  const f = ui.sheet;
  if (!f || f.kind !== 'pay' || f.mode === 'sort' || e.target.matches('input')) return;
  if (/^[0-9.]$/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
  else if (e.key === 'Backspace') { pressKey('back'); e.preventDefault(); }
  else if (e.key === 'Enter') { confirmPayment(); e.preventDefault(); }
});

// Swipe the sheet down by its header to dismiss.
(function sheetDrag() {
  let start = null;
  document.addEventListener('pointerdown', (e) => {
    const head = e.target.closest('[data-drag], .grabber');
    if (!head || e.target.closest('button')) return;
    start = { y: e.clientY, dy: 0 };
    $('#sheet').classList.add('dragging');
  });
  document.addEventListener('pointermove', (e) => {
    if (!start) return;
    start.dy = Math.max(0, e.clientY - start.y);
    $('#sheet').style.setProperty('--drag', `${start.dy}px`);
  });
  const end = () => {
    if (!start) return;
    const sheet = $('#sheet');
    sheet.classList.remove('dragging');
    sheet.style.removeProperty('--drag');
    if (start.dy > 110) closeSheet();
    start = null;
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
})();

// ====================================================================== connect

function showConnect() {
  app.innerHTML = `
    <div class="stage" style="overflow:auto">
      <form class="connect" id="connect-form">
        <img class="app-mark" src="icons/icon-192.png" alt="">
        <h1>Spending</h1>
        <p>Paste the secret key you set on your Cloudflare Worker (<b>APP_KEY</b>). It’s saved only on this iPhone.</p>
        <div class="group"><label class="visually-hidden" for="key-input">Secret key</label>
          <input id="key-input" name="key" type="password" placeholder="Secret key" autocomplete="off" autocapitalize="off" spellcheck="false" required></div>
        <p class="err" id="connect-err" role="alert"></p>
        <button class="btn btn-primary" type="submit" id="connect-btn">Connect</button>
      </form>
    </div>`;
  $('#connect-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#connect-btn');
    btn.disabled = true; btn.textContent = 'Connecting…';
    const res = await store.connect($('#key-input').value);
    if (res.ok) { boot(); return; }
    $('#connect-err').textContent = res.message;
    btn.disabled = false; btn.textContent = 'Connect';
  });
}

// ====================================================================== start

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
