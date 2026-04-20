-- risk_logs stores the result of each fraud evaluation (one row per transaction)
CREATE TABLE IF NOT EXISTS risk_logs (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id               UUID          NOT NULL UNIQUE REFERENCES transactions(tx_id) ON DELETE CASCADE,
  risk_score          INTEGER       NOT NULL CHECK (risk_score >= 0),
  decision            VARCHAR(10)   NOT NULL CHECK (decision IN ('ALLOW', 'REVIEW', 'BLOCK')),
  is_alert_generated  BOOLEAN       NOT NULL DEFAULT false,
  evaluation_time     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_logs_decision
  ON risk_logs (decision);

CREATE INDEX IF NOT EXISTS idx_risk_logs_evaluation_time
  ON risk_logs (evaluation_time DESC);
