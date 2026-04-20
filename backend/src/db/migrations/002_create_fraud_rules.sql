CREATE TABLE IF NOT EXISTS fraud_rules (
  rule_id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name       VARCHAR(100)  NOT NULL UNIQUE,
  description     TEXT,
  rule_type       VARCHAR(20)   NOT NULL CHECK (rule_type IN ('threshold', 'velocity', 'temporal')),
  field_name      VARCHAR(50)   NOT NULL,
  operator        VARCHAR(10)   NOT NULL CHECK (operator IN ('gt', 'lt', 'gte', 'lte', 'eq', 'neq', 'in', 'not_in', 'range', 'regex')),
  threshold_value TEXT          NOT NULL,
  weight          INTEGER       NOT NULL CHECK (weight BETWEEN 1 AND 100),
  priority        INTEGER       NOT NULL DEFAULT 10,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_by      UUID          REFERENCES users(user_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
