-- Payments. Amounts are stored as integer piasters (EGP x 100) to avoid float drift.
-- category IS NULL means "unsorted": captured by the Apple Pay Shortcut, not yet filed.
-- month is the Cairo-local calendar month of paid_at ("YYYY-MM"), kept in sync on every write.
CREATE TABLE IF NOT EXISTS payments (
  id            TEXT PRIMARY KEY,
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  category      TEXT,
  method        TEXT NOT NULL DEFAULT 'card',
  note          TEXT NOT NULL DEFAULT '',
  paid_at       TEXT NOT NULL,
  month         TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'manual',
  edited        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);

CREATE INDEX IF NOT EXISTS payments_month ON payments (month, deleted_at);
CREATE INDEX IF NOT EXISTS payments_unsorted ON payments (category, deleted_at);

-- Budgets repeat month to month: the budget for month M is the row with the
-- latest effective_month <= M. amount_cents NULL means "no limit".
CREATE TABLE IF NOT EXISTS budgets (
  category        TEXT NOT NULL,
  effective_month TEXT NOT NULL,
  amount_cents    INTEGER,
  PRIMARY KEY (category, effective_month)
);
