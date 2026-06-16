import request from 'supertest';
import pool from '../../src/db/client';
import app from '../../src/app';

const EVALUATE = '/api/transactions/evaluate';
const BASE     = '/api/results';

let testUserId: string;
let blockTxId:  string;
let allowTxId:  string;

// Explicit daytime to avoid the Night Hour temporal rule (10PM–5AM UTC)
const DAYTIME = '2026-06-16T10:00:00.000Z';

beforeAll(async () => {
  // Create a dedicated test user — cascade delete cleans up everything on teardown
  const { rows } = await pool.query<{ user_id: string }>(
    `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING user_id`,
    ['Results Integration User', `results-integration-${Date.now()}@test.com`]
  );
  testUserId = rows[0].user_id;

  // Evaluate a high-risk transaction → should produce BLOCK (amount 100,000 triggers
  // "High Amount Block" weight ≥ 70, putting score at BLOCK threshold)
  const blockRes = await request(app).post(EVALUATE).send({
    user_id:          testUserId,
    amount:           100_000,
    location:         'RU',
    device_id:        'device-results-test',
    transaction_time: DAYTIME,
  });
  blockTxId = blockRes.body.data.tx_id;

  // Evaluate a low-risk transaction → ALLOW
  const allowRes = await request(app).post(EVALUATE).send({
    user_id:          testUserId,
    amount:           100,
    location:         'IN',
    device_id:        'device-results-test',
    transaction_time: DAYTIME,
  });
  allowTxId = allowRes.body.data.tx_id;
});

afterAll(async () => {
  // Deleting the user cascades: transactions → risk_logs + rule_evaluation_trace
  await pool.query(`DELETE FROM users WHERE user_id = $1`, [testUserId]);
  await pool.end();
});

// ── GET /api/results ───────────────────────────────────────────────────────────

describe('GET /api/results', () => {

  test('returns 200 with success: true', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('data is an array', async () => {
    const res = await request(app).get(BASE);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('meta contains total, limit, offset', async () => {
    const res = await request(app).get(BASE);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('limit');
    expect(res.body.meta).toHaveProperty('offset');
  });

  test('total is a non-negative integer', async () => {
    const res = await request(app).get(BASE);
    expect(typeof res.body.meta.total).toBe('number');
    expect(res.body.meta.total).toBeGreaterThanOrEqual(0);
  });

  test('results include the evaluated test transactions', async () => {
    const res = await request(app).get(BASE);
    const txIds = res.body.data.map((r: { tx_id: string }) => r.tx_id);
    expect(txIds).toContain(blockTxId);
    expect(txIds).toContain(allowTxId);
  });

  test('each result has the required fields', async () => {
    const res = await request(app).get(BASE);
    const result = res.body.data[0];
    expect(result).toHaveProperty('tx_id');
    expect(result).toHaveProperty('decision');
    expect(result).toHaveProperty('risk_score');
    expect(result).toHaveProperty('is_alert_generated');
    expect(result).toHaveProperty('evaluation_time');
    expect(result).toHaveProperty('triggered_rules');
  });

  test('triggered_rules is an array on each result', async () => {
    const res = await request(app).get(BASE);
    for (const result of res.body.data) {
      expect(Array.isArray(result.triggered_rules)).toBe(true);
    }
  });

  test('decision values are valid (ALLOW, REVIEW, or BLOCK)', async () => {
    const res = await request(app).get(BASE);
    for (const result of res.body.data) {
      expect(['ALLOW', 'REVIEW', 'BLOCK']).toContain(result.decision);
    }
  });

  test('results are ordered by evaluation_time descending (most recent first)', async () => {
    const res = await request(app).get(BASE);
    const times = res.body.data.map((r: { evaluation_time: string }) =>
      new Date(r.evaluation_time).getTime()
    );
    for (let i = 1; i < times.length; i++) {
      expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
    }
  });
});

// ── GET /api/results — pagination ──────────────────────────────────────────────

describe('GET /api/results — pagination', () => {

  test('limit=1 returns exactly one result', async () => {
    const res = await request(app).get(`${BASE}?limit=1`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.meta.limit).toBe(1);
  });

  test('offset skips results correctly', async () => {
    const page1 = await request(app).get(`${BASE}?limit=1&offset=0`);
    const page2 = await request(app).get(`${BASE}?limit=1&offset=1`);
    expect(page1.body.data[0].tx_id).not.toBe(page2.body.data[0].tx_id);
  });

  test('limit is capped at 100 by the server', async () => {
    const res = await request(app).get(`${BASE}?limit=999`);
    expect(res.body.data.length).toBeLessThanOrEqual(100);
  });
});

// ── GET /api/results — decision filter ────────────────────────────────────────

describe('GET /api/results — decision filter', () => {

  test('?decision=BLOCK returns only BLOCK results', async () => {
    const res = await request(app).get(`${BASE}?decision=BLOCK`);
    expect(res.status).toBe(200);
    for (const result of res.body.data) {
      expect(result.decision).toBe('BLOCK');
    }
  });

  test('?decision=ALLOW returns only ALLOW results', async () => {
    const res = await request(app).get(`${BASE}?decision=ALLOW`);
    expect(res.status).toBe(200);
    for (const result of res.body.data) {
      expect(result.decision).toBe('ALLOW');
    }
  });

  test('BLOCK filter result set includes our high-risk transaction', async () => {
    const res = await request(app).get(`${BASE}?decision=BLOCK`);
    const txIds = res.body.data.map((r: { tx_id: string }) => r.tx_id);
    expect(txIds).toContain(blockTxId);
  });

  test('ALLOW filter result set includes our low-risk transaction', async () => {
    const res = await request(app).get(`${BASE}?decision=ALLOW`);
    const txIds = res.body.data.map((r: { tx_id: string }) => r.tx_id);
    expect(txIds).toContain(allowTxId);
  });

  test('decision filter is case-insensitive', async () => {
    const res = await request(app).get(`${BASE}?decision=block`);
    expect(res.status).toBe(200);
    for (const result of res.body.data) {
      expect(result.decision).toBe('BLOCK');
    }
  });
});

// ── GET /api/results/:txId ─────────────────────────────────────────────────────

describe('GET /api/results/:txId', () => {

  test('returns 200 with the correct result for a known tx_id', async () => {
    const res = await request(app).get(`${BASE}/${blockTxId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tx_id).toBe(blockTxId);
  });

  test('returned result has all required fields', async () => {
    const res = await request(app).get(`${BASE}/${blockTxId}`);
    const { data } = res.body;
    expect(data).toHaveProperty('tx_id');
    expect(data).toHaveProperty('decision');
    expect(data).toHaveProperty('risk_score');
    expect(data).toHaveProperty('is_alert_generated');
    expect(data).toHaveProperty('evaluation_time');
    expect(data).toHaveProperty('triggered_rules');
  });

  test('BLOCK result has is_alert_generated: true (score ≥ 70)', async () => {
    const res = await request(app).get(`${BASE}/${blockTxId}`);
    expect(res.body.data.decision).toBe('BLOCK');
    expect(res.body.data.is_alert_generated).toBe(true);
    expect(res.body.data.risk_score).toBeGreaterThanOrEqual(70);
  });

  test('ALLOW result has is_alert_generated: false (score < 70)', async () => {
    const res = await request(app).get(`${BASE}/${allowTxId}`);
    expect(res.body.data.decision).toBe('ALLOW');
    expect(res.body.data.is_alert_generated).toBe(false);
  });

  test('triggered_rules contains rule entries with correct shape', async () => {
    const res = await request(app).get(`${BASE}/${blockTxId}`);
    const rule = res.body.data.triggered_rules[0];
    if (rule) {
      expect(rule).toHaveProperty('rule_name');
      expect(rule).toHaveProperty('rule_type');
      expect(rule).toHaveProperty('reason');
    }
  });

  test('non-existent tx_id → 404', async () => {
    const res = await request(app).get(`${BASE}/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
