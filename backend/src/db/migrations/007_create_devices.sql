CREATE TABLE IF NOT EXISTS devices (
  device_id       VARCHAR(100)  PRIMARY KEY,
  user_id         UUID          REFERENCES users(user_id) ON DELETE SET NULL,
  device_type     VARCHAR(50),
  os              VARCHAR(50),
  first_seen_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id
  ON devices (user_id);
