-- rule_evaluation_trace stores which rules triggered for each evaluation (one row per triggered rule)
CREATE TABLE IF NOT EXISTS rule_evaluation_trace (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id           UUID        NOT NULL REFERENCES transactions(tx_id) ON DELETE CASCADE,
  rule_id         UUID        NOT NULL REFERENCES fraud_rules(rule_id) ON DELETE CASCADE,
  rule_name       VARCHAR(100) NOT NULL,
  rule_type       VARCHAR(20)  NOT NULL,
  weight_applied  INTEGER      NOT NULL,
  reason          TEXT         NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trace_tx_id
  ON rule_evaluation_trace (tx_id);
