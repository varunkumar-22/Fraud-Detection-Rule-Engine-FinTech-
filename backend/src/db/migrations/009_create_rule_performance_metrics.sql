-- Tracks how often each rule triggers and its decision impact — useful for tuning weights
CREATE TABLE IF NOT EXISTS rule_performance_metrics (
  rule_id           UUID          PRIMARY KEY REFERENCES fraud_rules(rule_id) ON DELETE CASCADE,
  total_evaluations INTEGER       NOT NULL DEFAULT 0,
  total_triggers    INTEGER       NOT NULL DEFAULT 0,
  block_triggers    INTEGER       NOT NULL DEFAULT 0,
  review_triggers   INTEGER       NOT NULL DEFAULT 0,
  allow_triggers    INTEGER       NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
