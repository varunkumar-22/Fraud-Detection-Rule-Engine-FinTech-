-- velocity_tracking caches pre-computed velocity snapshots per user per time window
-- Used as an optional read-through cache to avoid repeated aggregation queries
CREATE TABLE IF NOT EXISTS velocity_tracking (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  window_start    TIMESTAMPTZ   NOT NULL,
  window_end      TIMESTAMPTZ   NOT NULL,
  tx_count        INTEGER       NOT NULL DEFAULT 0,
  tx_amount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_velocity_user_window UNIQUE (user_id, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_velocity_user_window
  ON velocity_tracking (user_id, window_end DESC);
