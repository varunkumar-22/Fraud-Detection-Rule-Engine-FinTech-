// Mock the DB pool BEFORE importing velocityChecker
jest.mock('../../src/db/client', () => ({
  query: jest.fn(),
}));

import pool from '../../src/db/client';
import { getVelocityData } from '../../src/engine/velocityChecker';

const mockPool = pool as jest.Mocked<typeof pool>;

// Reference time used across all tests
const referenceTime = new Date('2026-04-12T10:00:00Z');
const userId        = 'user-001';

// Helper to set up mock DB responses for both 1h and 24h queries
function mockDbResponses(
  count1h: number, total1h: number,
  count24h: number, total24h: number
) {
  mockPool.query
    .mockResolvedValueOnce({ rows: [{ count: String(count1h), total: String(total1h) }] } as never)
    .mockResolvedValueOnce({ rows: [{ count: String(count24h), total: String(total24h) }] } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Return Shape Tests ───────────────────────────────────────────────────────

describe('getVelocityData — return shape', () => {

  test('returns all four velocity fields', async () => {
    mockDbResponses(3, 5000, 10, 25000);
    const result = await getVelocityData(userId, referenceTime);

    expect(result).toHaveProperty('tx_count_1h');
    expect(result).toHaveProperty('tx_amount_1h');
    expect(result).toHaveProperty('tx_count_24h');
    expect(result).toHaveProperty('tx_amount_24h');
  });

  test('returns numeric values for all fields', async () => {
    mockDbResponses(3, 5000, 10, 25000);
    const result = await getVelocityData(userId, referenceTime);

    expect(typeof result.tx_count_1h).toBe('number');
    expect(typeof result.tx_amount_1h).toBe('number');
    expect(typeof result.tx_count_24h).toBe('number');
    expect(typeof result.tx_amount_24h).toBe('number');
  });
});

// ─── Value Correctness Tests ──────────────────────────────────────────────────

describe('getVelocityData — value correctness', () => {

  test('returns correct 1h count and amount', async () => {
    mockDbResponses(5, 12000, 20, 60000);
    const result = await getVelocityData(userId, referenceTime);

    expect(result.tx_count_1h).toBe(5);
    expect(result.tx_amount_1h).toBe(12000);
  });

  test('returns correct 24h count and amount', async () => {
    mockDbResponses(5, 12000, 20, 60000);
    const result = await getVelocityData(userId, referenceTime);

    expect(result.tx_count_24h).toBe(20);
    expect(result.tx_amount_24h).toBe(60000);
  });

  test('returns 0 count and 0 amount when user has no recent transactions', async () => {
    mockDbResponses(0, 0, 0, 0);
    const result = await getVelocityData(userId, referenceTime);

    expect(result.tx_count_1h).toBe(0);
    expect(result.tx_amount_1h).toBe(0);
    expect(result.tx_count_24h).toBe(0);
    expect(result.tx_amount_24h).toBe(0);
  });

  test('24h count is always >= 1h count', async () => {
    mockDbResponses(3, 9000, 12, 45000);
    const result = await getVelocityData(userId, referenceTime);

    expect(result.tx_count_24h).toBeGreaterThanOrEqual(result.tx_count_1h);
    expect(result.tx_amount_24h).toBeGreaterThanOrEqual(result.tx_amount_1h);
  });

  test('handles large transaction counts correctly', async () => {
    mockDbResponses(100, 500000, 500, 2500000);
    const result = await getVelocityData(userId, referenceTime);

    expect(result.tx_count_1h).toBe(100);
    expect(result.tx_amount_1h).toBe(500000);
    expect(result.tx_count_24h).toBe(500);
    expect(result.tx_amount_24h).toBe(2500000);
  });
});

// ─── DB Query Tests ───────────────────────────────────────────────────────────

describe('getVelocityData — DB queries', () => {

  test('makes exactly 2 DB queries (one for 1h, one for 24h)', async () => {
    mockDbResponses(3, 5000, 10, 25000);
    await getVelocityData(userId, referenceTime);

    expect(mockPool.query).toHaveBeenCalledTimes(2);
  });

  test('passes the correct userId to both queries', async () => {
    mockDbResponses(3, 5000, 10, 25000);
    await getVelocityData(userId, referenceTime);

    const firstCall  = (mockPool.query as jest.Mock).mock.calls[0];
    const secondCall = (mockPool.query as jest.Mock).mock.calls[1];

    expect(firstCall[1][0]).toBe(userId);
    expect(secondCall[1][0]).toBe(userId);
  });

  test('1h query uses a time window 1 hour before reference time', async () => {
    mockDbResponses(3, 5000, 10, 25000);
    await getVelocityData(userId, referenceTime);

    const firstCall = (mockPool.query as jest.Mock).mock.calls[0];
    const windowStart: Date = firstCall[1][1];
    const windowEnd: Date   = firstCall[1][2];

    const diffMs = windowEnd.getTime() - windowStart.getTime();
    expect(diffMs).toBe(60 * 60 * 1000); // exactly 1 hour
  });

  test('24h query uses a time window 24 hours before reference time', async () => {
    mockDbResponses(3, 5000, 10, 25000);
    await getVelocityData(userId, referenceTime);

    const secondCall = (mockPool.query as jest.Mock).mock.calls[1];
    const windowStart: Date = secondCall[1][1];
    const windowEnd: Date   = secondCall[1][2];

    const diffMs = windowEnd.getTime() - windowStart.getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000); // exactly 24 hours
  });
});
