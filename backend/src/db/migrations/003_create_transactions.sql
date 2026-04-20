CREATE TABLE IF NOT EXISTS transactions (
  tx_id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  location          VARCHAR(100)  NOT NULL,
  device_id         VARCHAR(100)  NOT NULL,
  transaction_time  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  is_simulation     BOOLEAN       NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time
  ON transactions (user_id, transaction_time);
