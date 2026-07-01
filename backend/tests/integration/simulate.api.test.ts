import request from 'supertest';
import pool from '../../src/db/client';
import app from '../../src/app';

const BASE    = '/api/simulate';
const RESULTS = '/api/results';

let testUserId: string;

// Explicit daytime to avoid the Night Hour temporal rule (10PM–5AM UTC)
const DAYTIME = '2026-06-16T10:00:00.000Z';

beforeAll(async () => {
  const { rows } = await pool.query<{ user_id: string }>(
    `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING user_id`,
    ['Simulate Integration User', `simulate-integration-${Date.now()}@test.com`]
  );
  testUserId = rows[0].user_id;
});

afterAll(async () => {
  // No transactions are written by simulate, so only the user needs cleanup
  await pool.query(`DELETE FROM users WHERE user_id = $1`, [testUserId]);
  await pool.end();
});

const payload = (overrides: Record<string, unknown> = {}) => ({
  user_id:          testUserId,
  amount:           500,
  location:         'IN',
  device_id:        'device-simulate-test',
  transaction_time: DAYTIME,
  ...overrides,
});

// ── Response Shape ─────────────────────────────────────────────────────────────

describe('POST /api/simulate — response shape', () => {

  test('returns 200 with success: true', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('data contains all required fields', async () => {
    const res = await request(app).post(BASE).send(payload());
    const { data } = res.body;
    expect(data).toHaveProperty('tx_id');
    expect(data).toHaveProperty('decision');
    expect(data).toHaveProperty('risk_score');
    expect(data).toHaveProperty('triggered_rules');
    expect(data).toHaveProperty('score_breakdown');
    expect(data).toHaveProperty('evaluation_time');
    expect(data).toHaveProperty('is_alert_generated');
  });

  test('tx_id is a valid UUID', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(res.body.data.tx_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  test('decision is one of ALLOW, REVIEW, BLOCK', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(['ALLOW', 'REVIEW', 'BLOCK']).toContain(res.body.data.decision);
  });

  test('risk_score is a non-negative number', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(typeof res.body.data.risk_score).toBe('number');
    expect(res.body.data.risk_score).toBeGreaterThanOrEqual(0);
  });

  test('triggered_rules is an array', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(Array.isArray(res.body.data.triggered_rules)).toBe(true);
  });

  test('score_breakdown is an array', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(Array.isArray(res.body.data.score_breakdown)).toBe(true);
  });

  test('evaluation_time is a valid ISO datetime string', async () => {
    const res = await request(app).post(BASE).send(payload());
    const d = new Date(res.body.data.evaluation_time);
    expect(isNaN(d.getTime())).toBe(false);
  });

  test('is_alert_generated is a boolean', async () => {
    const res = await request(app).post(BASE).send(payload());
    expect(typeof res.body.data.is_alert_generated).toBe('boolean');
  });
});

// ── No DB Persistence (critical difference from /evaluate) ────────────────────

describe('POST /api/simulate — does not persist to database', () => {

  test('simulated tx_id does not appear in GET /api/results', async () => {
    const simRes = await request(app).post(BASE).send(payload({ amount: 100_000 }));
    const txId   = simRes.body.data.tx_id;

    const resultsRes = await request(app).get(`${RESULTS}/${txId}`);
    expect(resultsRes.status).toBe(404);
  });

  test('simulated tx_id is not stored in transactions table', async () => {
    const simRes = await request(app).post(BASE).send(payload());
    const txId   = simRes.body.data.tx_id;

    const { rows } = await pool.query(
      `SELECT tx_id FROM transactions WHERE tx_id = $1`,
      [txId]
    );
    expect(rows.length).toBe(0);
  });

  test('each simulation produces a unique tx_id', async () => {
    const [a, b] = await Promise.all([
      request(app).post(BASE).send(payload()),
      request(app).post(BASE).send(payload()),
    ]);
    expect(a.body.data.tx_id).not.toBe(b.body.data.tx_id);
  });
});

// ── Decision Correctness ───────────────────────────────────────────────────────

describe('POST /api/simulate — decision outcomes', () => {

  test('high amount (₹100,000) produces BLOCK decision', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: 100_000 }));
    expect(res.body.data.decision).toBe('BLOCK');
    expect(res.body.data.is_alert_generated).toBe(true);
    expect(res.body.data.risk_score).toBeGreaterThanOrEqual(70);
  });

  test('high amount triggers at least one rule', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: 100_000 }));
    expect(res.body.data.triggered_rules.length).toBeGreaterThan(0);
  });

  test('triggered rule entries have the correct shape', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: 100_000 }));
    const rule = res.body.data.triggered_rules[0];
    expect(rule).toHaveProperty('rule_id');
    expect(rule).toHaveProperty('rule_name');
    expect(rule).toHaveProperty('rule_type');
    expect(rule).toHaveProperty('weight_applied');
    expect(rule).toHaveProperty('reason');
  });

  test('score_breakdown entries match triggered_rules count', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: 100_000 }));
    const { triggered_rules, score_breakdown } = res.body.data;
    expect(score_breakdown.length).toBe(triggered_rules.length);
  });

  test('small safe amount (₹100) during daytime produces ALLOW decision', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: 100 }));
    expect(res.body.data.decision).toBe('ALLOW');
    expect(res.body.data.is_alert_generated).toBe(false);
  });

  test('optional transaction_time is accepted', async () => {
    const res = await request(app).post(BASE).send(payload({ transaction_time: '2026-06-16T14:30:00.000Z' }));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('omitting transaction_time defaults to current time', async () => {
    const { transaction_time, ...noTime } = payload();
    const res = await request(app).post(BASE).send(noTime);
    expect(res.status).toBe(200);
    const d = new Date(res.body.data.evaluation_time);
    expect(isNaN(d.getTime())).toBe(false);
  });
});

// ── Validation Errors ─────────────────────────────────────────────────────────

describe('POST /api/simulate — validation errors (400)', () => {

  test('missing user_id → 400', async () => {
    const { user_id, ...body } = payload();
    const res = await request(app).post(BASE).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid user_id (not a UUID) → 400', async () => {
    const res = await request(app).post(BASE).send(payload({ user_id: 'not-a-uuid' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('missing amount → 400', async () => {
    const { amount, ...body } = payload();
    const res = await request(app).post(BASE).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('zero amount → 400', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: 0 }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('negative amount → 400', async () => {
    const res = await request(app).post(BASE).send(payload({ amount: -500 }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('missing location → 400', async () => {
    const { location, ...body } = payload();
    const res = await request(app).post(BASE).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('empty location string → 400', async () => {
    const res = await request(app).post(BASE).send(payload({ location: '' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('missing device_id → 400', async () => {
    const { device_id, ...body } = payload();
    const res = await request(app).post(BASE).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid transaction_time (not ISO 8601) → 400', async () => {
    const res = await request(app).post(BASE).send(payload({ transaction_time: '16-06-2026' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('empty body → 400', async () => {
    const res = await request(app).post(BASE).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('error response includes errors array with messages', async () => {
    const res = await request(app).post(BASE).send({});
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});
