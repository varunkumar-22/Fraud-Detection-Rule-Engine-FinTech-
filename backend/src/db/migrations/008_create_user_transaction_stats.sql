-- Aggregated lifetime stats per user — updated after each evaluated transaction
CREATE TABLE IF NOT EXISTS user_transaction_stats (
  user_id           UUID          PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  total_tx_count    INTEGER       NOT NULL DEFAULT 0,
  total_tx_amount   NUMERIC(16,2) NOT NULL DEFAULT 0,
  block_count       INTEGER       NOT NULL DEFAULT 0,
  review_count      INTEGER       NOT NULL DEFAULT 0,
  allow_count       INTEGER       NOT NULL DEFAULT 0,
  last_tx_at        TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
