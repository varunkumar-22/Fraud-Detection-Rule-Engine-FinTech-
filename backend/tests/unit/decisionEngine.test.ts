// Mock DB and engine dependencies BEFORE any imports
jest.mock('../../src/db/client', () => ({ query: jest.fn() }));
jest.mock('../../src/engine/velocityChecker');

import pool from '../../src/db/client';
import { getVelocityData } from '../../src/engine/velocityChecker';
import { runEvaluation, isAlreadyEvaluated } from '../../src/engine/decisionEngine';
import { FraudRule } from '../../src/types/rule.types';
import { Transaction } from '../../src/types/transaction.types';
import { VelocityData } from '../../src/engine/ruleEvaluator';

const mockPool          = pool as jest.Mocked<typeof pool>;
const mockGetVelocity   = getVelocityData as jest.MockedFunction<typeof getVelocityData>;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockTransaction: Transaction = {
  tx_id:            'tx-001',
  user_id:          'user-001',
  amount:           15000,
  location:         'RU',
  device_id:        'device-001',
  transaction_time: new Date('2026-04-12T02:30:00Z'),
  is_simulation:    false,
  created_at:       new Date(),
};

const mockVelocity: VelocityData = {
  tx_count_1h:   8,
  tx_count_24h:  15,
  tx_amount_1h:  20000,
  tx_amount_24h: 50000,
};

const highAmountRule: FraudRule = {
  rule_id:         'rule-001',
  rule_name:       'High Amount',
  rule_type:       'threshold',
  field_name:      'amount',
  operator:        'gt',
  threshold_value: '10000',
  weight:          50,
  priority:        1,
  is_active:       true,
  created_by:      null,
  created_at:      new Date(),
  updated_at:      new Date(),
};

const velocityRule: FraudRule = {
  rule_id:         'rule-002',
  rule_name:       'High Velocity',
  rule_type:       'velocity',
  field_name:      'tx_count_1h',
  operator:        'gt',
  threshold_value: '5',
  weight:          40,
  priority:        2,
  is_active:       true,
  created_by:      null,
  created_at:      new Date(),
  updated_at:      new Date(),
};

const lowWeightRule: FraudRule = {
  rule_id:         'rule-003',
  rule_name:       'Low Risk Rule',
  rule_type:       'threshold',
  field_name:      'amount',
  operator:        'gt',
  threshold_value: '100',
  weight:          10,
  priority:        3,
  is_active:       true,
  created_by:      null,
  created_at:      new Date(),
  updated_at:      new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: transaction has NOT been evaluated before
  mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as never);
  mockGetVelocity.mockResolvedValue(mockVelocity);
});

// ─── isAlreadyEvaluated Tests ─────────────────────────────────────────────────

describe('isAlreadyEvaluated', () => {

  test('returns false when tx_id has no existing evaluation', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    const result = await isAlreadyEvaluated('tx-new');
    expect(result).toBe(false);
  });

  test('returns true when tx_id already exists in risk_logs', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as never);
    const result = await isAlreadyEvaluated('tx-existing');
    expect(result).toBe(true);
  });

  test('queries risk_logs table with the correct tx_id', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    await isAlreadyEvaluated('tx-check-001');
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining('risk_logs'),
      ['tx-check-001']
    );
  });
});

// ─── runEvaluation — Full Pipeline Tests ─────────────────────────────────────

describe('runEvaluation — full pipeline', () => {

  test('returns explainable output with correct tx_id', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule]);
    expect(result.tx_id).toBe('tx-001');
  });

  test('returns a valid decision (ALLOW, REVIEW, or BLOCK)', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule]);
    expect(['ALLOW', 'REVIEW', 'BLOCK']).toContain(result.decision);
  });

  test('returns risk_score as a number', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule]);
    expect(typeof result.risk_score).toBe('number');
  });

  test('includes triggered_rules in output', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule]);
    expect(Array.isArray(result.triggered_rules)).toBe(true);
  });

  test('includes score_breakdown in output', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule]);
    expect(Array.isArray(result.score_breakdown)).toBe(true);
  });

  test('includes evaluation_time as ISO string', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule]);
    expect(typeof result.evaluation_time).toBe('string');
    expect(() => new Date(result.evaluation_time)).not.toThrow();
  });
});

// ─── runEvaluation — Decision Correctness Tests ───────────────────────────────

describe('runEvaluation — decision correctness', () => {

  test('ALLOW decision when no rules trigger', async () => {
    const noMatchRule: FraudRule = { ...highAmountRule, threshold_value: '999999' };
    const result = await runEvaluation(mockTransaction, [noMatchRule]);
    expect(result.decision).toBe('ALLOW');
    expect(result.risk_score).toBe(0);
    expect(result.triggered_rules).toHaveLength(0);
  });

  test('BLOCK decision when high weight rules trigger', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule, velocityRule]);
    expect(result.decision).toBe('BLOCK');    // weight 50 + 40 = 90 → BLOCK
    expect(result.risk_score).toBe(90);
  });

  test('REVIEW decision when medium weight rule triggers', async () => {
    const mediumRule: FraudRule = { ...highAmountRule, weight: 40 };
    const result = await runEvaluation(mockTransaction, [mediumRule]);
    expect(result.decision).toBe('REVIEW');   // weight 40 → REVIEW
    expect(result.risk_score).toBe(40);
  });

  test('triggered rules list contains only the rules that fired', async () => {
    const noMatchRule: FraudRule = { ...highAmountRule, rule_id: 'rule-999', threshold_value: '999999' };
    const result = await runEvaluation(mockTransaction, [highAmountRule, noMatchRule]);
    expect(result.triggered_rules).toHaveLength(1);
    expect(result.triggered_rules[0].rule_id).toBe('rule-001');
  });

  test('score_breakdown matches triggered rules', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule, velocityRule]);
    expect(result.score_breakdown).toHaveLength(result.triggered_rules.length);
  });

  test('is_alert_generated is true when score >= 70', async () => {
    const result = await runEvaluation(mockTransaction, [highAmountRule, velocityRule]);
    expect(result.is_alert_generated).toBe(true);  // score 90 >= 70
  });

  test('is_alert_generated is false when score < 70', async () => {
    const result = await runEvaluation(mockTransaction, [lowWeightRule]);
    expect(result.is_alert_generated).toBe(false); // score 10 < 70
  });

  test('empty rules list → ALLOW with score 0', async () => {
    const result = await runEvaluation(mockTransaction, []);
    expect(result.decision).toBe('ALLOW');
    expect(result.risk_score).toBe(0);
    expect(result.triggered_rules).toHaveLength(0);
  });
});

// ─── Idempotency Tests ────────────────────────────────────────────────────────

describe('runEvaluation — idempotency', () => {

  test('throws error if transaction has already been evaluated', async () => {
    // First call: not evaluated
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);
    await runEvaluation(mockTransaction, [highAmountRule]);

    // Second call: already evaluated
    mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as never);
    await expect(runEvaluation(mockTransaction, [highAmountRule]))
      .rejects.toThrow(`Transaction ${mockTransaction.tx_id} has already been evaluated`);
  });

  test('error message contains the duplicate tx_id', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as never);
    await expect(runEvaluation(mockTransaction, []))
      .rejects.toThrow('tx-001');
  });

  test('velocityChecker is NOT called for duplicate transactions', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ 1: 1 }], rowCount: 1 } as never);
    await expect(runEvaluation(mockTransaction, [])).rejects.toThrow();
    expect(mockGetVelocity).not.toHaveBeenCalled();
  });
});

// ─── Integration with velocityChecker Tests ───────────────────────────────────

describe('runEvaluation — velocityChecker integration', () => {

  test('calls velocityChecker with correct user_id', async () => {
    await runEvaluation(mockTransaction, []);
    expect(mockGetVelocity).toHaveBeenCalledWith('user-001', expect.any(Date));
  });

  test('calls velocityChecker exactly once per evaluation', async () => {
    await runEvaluation(mockTransaction, [highAmountRule]);
    expect(mockGetVelocity).toHaveBeenCalledTimes(1);
  });

  test('velocity rule triggers correctly using mocked velocity data', async () => {
    // tx_count_1h = 8, rule threshold = 5 → should trigger
    const result = await runEvaluation(mockTransaction, [velocityRule]);
    expect(result.triggered_rules).toHaveLength(1);
    expect(result.triggered_rules[0].rule_name).toBe('High Velocity');
  });

  test('velocity rule does not trigger when count is within limit', async () => {
    mockGetVelocity.mockResolvedValueOnce({ ...mockVelocity, tx_count_1h: 2 });
    const result = await runEvaluation(mockTransaction, [velocityRule]);
    expect(result.triggered_rules).toHaveLength(0);
  });
});
