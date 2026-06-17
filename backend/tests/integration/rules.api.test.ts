import request from 'supertest';
import pool from '../../src/db/client';
import app from '../../src/app';

const BASE = '/api/rules';

// Tracks every rule created during tests so afterAll can clean up any leftovers
const createdRuleIds: string[] = [];

let counter = 0;
const uniqueName = () => `Integration Test Rule ${Date.now()}-${++counter}`;

const rulePayload = (overrides: Record<string, unknown> = {}) => ({
  rule_name:       uniqueName(),
  rule_type:       'threshold',
  field_name:      'amount',
  operator:        'gt',
  threshold_value: '999999',
  weight:          5,
  priority:        99,
  ...overrides,
});

afterAll(async () => {
  if (createdRuleIds.length > 0) {
    await pool.query(
      `DELETE FROM fraud_rules WHERE rule_id = ANY($1::uuid[])`,
      [createdRuleIds]
    );
  }
  await pool.end();
});

// ── GET /api/rules ─────────────────────────────────────────────────────────────

describe('GET /api/rules', () => {

  test('returns 200 with success: true', async () => {
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('data is an array', async () => {
    const res = await request(app).get(BASE);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('each rule has required fields', async () => {
    const res = await request(app).get(BASE);
    const rule = res.body.data[0];
    if (rule) {
      expect(rule).toHaveProperty('rule_id');
      expect(rule).toHaveProperty('rule_name');
      expect(rule).toHaveProperty('rule_type');
      expect(rule).toHaveProperty('field_name');
      expect(rule).toHaveProperty('operator');
      expect(rule).toHaveProperty('threshold_value');
      expect(rule).toHaveProperty('weight');
      expect(rule).toHaveProperty('is_active');
    }
  });
});

// ── POST /api/rules ────────────────────────────────────────────────────────────

describe('POST /api/rules', () => {

  test('creates a rule and returns 201 with the new rule', async () => {
    const body = rulePayload();
    const res = await request(app).post(BASE).send(body);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rule_name).toBe(body.rule_name);
    createdRuleIds.push(res.body.data.rule_id);
  });

  test('new rule has a valid UUID as rule_id', async () => {
    const res = await request(app).post(BASE).send(rulePayload());
    expect(res.body.data.rule_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    createdRuleIds.push(res.body.data.rule_id);
  });

  test('new rule is active by default', async () => {
    const res = await request(app).post(BASE).send(rulePayload());
    expect(res.body.data.is_active).toBe(true);
    createdRuleIds.push(res.body.data.rule_id);
  });

  test('new rule has created_at and updated_at timestamps', async () => {
    const res = await request(app).post(BASE).send(rulePayload());
    expect(res.body.data).toHaveProperty('created_at');
    expect(res.body.data).toHaveProperty('updated_at');
    createdRuleIds.push(res.body.data.rule_id);
  });

  test('optional description is stored when provided', async () => {
    const res = await request(app).post(BASE).send(rulePayload({ description: 'Test desc' }));
    expect(res.body.data.description).toBe('Test desc');
    createdRuleIds.push(res.body.data.rule_id);
  });

  test('duplicate rule_name → 409', async () => {
    const name = uniqueName();
    const first = await request(app).post(BASE).send(rulePayload({ rule_name: name }));
    createdRuleIds.push(first.body.data.rule_id);

    const second = await request(app).post(BASE).send(rulePayload({ rule_name: name }));
    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
  });

  test('missing rule_name → 400', async () => {
    const { rule_name, ...body } = rulePayload();
    const res = await request(app).post(BASE).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid rule_type → 400', async () => {
    const res = await request(app).post(BASE).send(rulePayload({ rule_type: 'invalid_type' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('invalid operator → 400', async () => {
    const res = await request(app).post(BASE).send(rulePayload({ operator: 'between' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('weight above 100 → 400', async () => {
    const res = await request(app).post(BASE).send(rulePayload({ weight: 101 }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('weight below 1 → 400', async () => {
    const res = await request(app).post(BASE).send(rulePayload({ weight: 0 }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('empty body → 400', async () => {
    const res = await request(app).post(BASE).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('all supported rule_types are accepted', async () => {
    for (const rule_type of ['threshold', 'velocity', 'temporal']) {
      const res = await request(app).post(BASE).send(rulePayload({ rule_type }));
      expect(res.status).toBe(201);
      createdRuleIds.push(res.body.data.rule_id);
    }
  });
});

// ── GET /api/rules/:id ─────────────────────────────────────────────────────────

describe('GET /api/rules/:id', () => {

  let ruleId: string;
  let ruleName: string;

  beforeAll(async () => {
    const body = rulePayload();
    ruleName = body.rule_name as string;
    const res = await request(app).post(BASE).send(body);
    ruleId = res.body.data.rule_id;
    createdRuleIds.push(ruleId);
  });

  test('returns 200 with the correct rule', async () => {
    const res = await request(app).get(`${BASE}/${ruleId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rule_id).toBe(ruleId);
    expect(res.body.data.rule_name).toBe(ruleName);
  });

  test('non-existent rule_id → 404', async () => {
    const res = await request(app).get(`${BASE}/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── PUT /api/rules/:id ─────────────────────────────────────────────────────────

describe('PUT /api/rules/:id', () => {

  let ruleId: string;

  beforeAll(async () => {
    const res = await request(app).post(BASE).send(rulePayload());
    ruleId = res.body.data.rule_id;
    createdRuleIds.push(ruleId);
  });

  test('updates the rule and returns the updated data', async () => {
    const res = await request(app)
      .put(`${BASE}/${ruleId}`)
      .send({ weight: 42, threshold_value: '77777' });
    expect(res.status).toBe(200);
    expect(res.body.data.weight).toBe(42);
    expect(res.body.data.threshold_value).toBe('77777');
  });

  test('non-existent rule_id → 404', async () => {
    const res = await request(app)
      .put(`${BASE}/00000000-0000-0000-0000-000000000000`)
      .send({ weight: 10 });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── PATCH /api/rules/:id ───────────────────────────────────────────────────────

describe('PATCH /api/rules/:id (toggle)', () => {

  let ruleId: string;

  beforeAll(async () => {
    const res = await request(app).post(BASE).send(rulePayload());
    ruleId = res.body.data.rule_id;
    createdRuleIds.push(ruleId);
  });

  test('disables an active rule', async () => {
    const res = await request(app)
      .patch(`${BASE}/${ruleId}`)
      .send({ is_active: false });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });

  test('re-enables a disabled rule', async () => {
    await request(app).patch(`${BASE}/${ruleId}`).send({ is_active: false });
    const res = await request(app).patch(`${BASE}/${ruleId}`).send({ is_active: true });
    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(true);
  });

  test('missing is_active → 400', async () => {
    const res = await request(app).patch(`${BASE}/${ruleId}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('non-boolean is_active → 400', async () => {
    const res = await request(app).patch(`${BASE}/${ruleId}`).send({ is_active: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('non-existent rule_id → 404', async () => {
    const res = await request(app)
      .patch(`${BASE}/00000000-0000-0000-0000-000000000000`)
      .send({ is_active: false });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ── DELETE /api/rules/:id ──────────────────────────────────────────────────────

describe('DELETE /api/rules/:id', () => {

  test('deletes a rule and returns 200', async () => {
    const created = await request(app).post(BASE).send(rulePayload());
    const ruleId  = created.body.data.rule_id;

    const res = await request(app).delete(`${BASE}/${ruleId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('deleted rule is no longer retrievable', async () => {
    const created = await request(app).post(BASE).send(rulePayload());
    const ruleId  = created.body.data.rule_id;

    await request(app).delete(`${BASE}/${ruleId}`);

    const res = await request(app).get(`${BASE}/${ruleId}`);
    expect(res.status).toBe(404);
  });

  test('non-existent rule_id → 404', async () => {
    const res = await request(app).delete(`${BASE}/00000000-0000-0000-0000-000000000000`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
