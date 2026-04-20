CREATE TABLE IF NOT EXISTS users (
  user_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255)  NOT NULL UNIQUE,
  name        VARCHAR(100)  NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
