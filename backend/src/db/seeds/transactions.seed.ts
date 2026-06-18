import pool from '../client';
import { loadActiveRules } from '../../engine/ruleLoader';
import { runEvaluation } from '../../engine/decisionEngine';
import { Transaction } from '../../types/transaction.types';

// Seed users first so the foreign key on transactions is satisfied
const users = [
  { user_id: 'a1b2c3d4-0001-0001-0001-000000000001', email: 'alice@example.com',   name: 'Alice' },
  { user_id: 'a1b2c3d4-0002-0002-0002-000000000002', email: 'bob@example.com',     name: 'Bob' },
  { user_id: 'a1b2c3d4-0003-0003-0003-000000000003', email: 'charlie@example.com', name: 'Charlie' },
];

// Transactions designed to exercise every decision outcome
const transactions = [

  // --- Scenario: Large Amount → BLOCK (High Amount Block weight 70 + Medium Amount Review weight 30 = 100) ---
  {
    user_id:          'a1b2c3d4-0001-0001-0001-000000000001',
    amount:           85000,
    location:         'US',
    device_id:        'device-alice-001',
    transaction_time: '2026-04-12T14:00:00Z',
    is_simulation:    false,
    label:            'BLOCK — large amount (₹85,000)',
  },

  // --- Scenario: Safe Amount → ALLOW (Safe Amount weight 10, score < 30) ---
  {
    user_id:          'a1b2c3d4-0001-0001-0001-000000000001',
    amount:           3000,
    location:         'US',
    device_id:        'device-alice-001',
    transaction_time: '2026-04-12T11:00:00Z',
    is_simulation:    false,
    label:            'ALLOW — safe amount (₹3,000)',
  },

  // --- Scenario: Night Time → BLOCK (Night Hour weight 40 + Medium Amount weight 30 = 70) ---
  {
    user_id:          'a1b2c3d4-0002-0002-0002-000000000002',
    amount:           8000,
    location:         'US',
    device_id:        'device-bob-001',
    transaction_time: '2026-04-12T02:30:00Z',
    is_simulation:    false,
    label:            'BLOCK — night transaction with medium amount',
  },

  // --- Scenario: Daytime Medium Amount → REVIEW (Medium Amount weight 30) ---
  {
    user_id:          'a1b2c3d4-0002-0002-0002-000000000002',
    amount:           8000,
    location:         'US',
    device_id:        'device-bob-001',
    transaction_time: '2026-04-12T10:00:00Z',
    is_simulation:    false,
    label:            'REVIEW — daytime medium amount',
  },

  // --- Scenario: Rapid Velocity — base transaction ---
  {
    user_id:          'a1b2c3d4-0003-0003-0003-000000000003',
    amount:           2000,
    location:         'IN',
    device_id:        'device-charlie-001',
    transaction_time: '2026-04-12T14:00:00Z',
    is_simulation:    false,
    label:            'base transaction — BLOCK when velocity is high',
  },

  // --- Simulation example — not evaluated, used for frontend demo only ---
  {
    user_id:          'a1b2c3d4-0001-0001-0001-000000000001',
    amount:           500,
    location:         'IN',
    device_id:        'device-alice-mobile',
    transaction_time: '2026-04-12T09:00:00Z',
    is_simulation:    true,
    label:            'ALLOW — simulation, low amount daytime',
  },
];

async function seedUsers() {
  for (const user of users) {
    await pool.query(
      `INSERT INTO users (user_id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.user_id, user.email, user.name]
    );
    console.log(`  Seeded user: ${user.name}`);
  }
}

async function seedTransactions() {
  console.log('Seeding transactions...');

  for (const tx of transactions) {
    await pool.query(
      `INSERT INTO transactions (user_id, amount, location, device_id, transaction_time, is_simulation)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [tx.user_id, tx.amount, tx.location, tx.device_id, new Date(tx.transaction_time), tx.is_simulation]
    );
    console.log(`  Seeded tx: ${tx.label}`);
  }

  console.log(`Seeded ${transactions.length} transactions.`);
}

// Evaluate all non-simulation seeded transactions that have not yet been evaluated.
// This populates risk_logs and rule_evaluation_trace so the Dashboard and Results
// pages show real data immediately after npm run seed.
async function evaluateSeededTransactions() {
  console.log('Evaluating seeded transactions...');

  const { rows: unevaluated } = await pool.query<Transaction>(
    `SELECT t.*
     FROM transactions t
     LEFT JOIN risk_logs rl ON rl.tx_id = t.tx_id
     WHERE t.user_id = ANY($1::uuid[])
       AND t.is_simulation = false
       AND rl.tx_id IS NULL`,
    [users.map(u => u.user_id)]
  );

  if (unevaluated.length === 0) {
    console.log('  All seeded transactions already evaluated.');
    return;
  }

  const rules = await loadActiveRules();

  for (const tx of unevaluated) {
    const output = await runEvaluation(tx, rules);

    await pool.query(
      `INSERT INTO risk_logs (tx_id, risk_score, decision, is_alert_generated, evaluation_time)
       VALUES ($1, $2, $3, $4, $5)`,
      [output.tx_id, output.risk_score, output.decision, output.is_alert_generated, new Date(output.evaluation_time)]
    );

    if (output.triggered_rules.length > 0) {
      const values = output.triggered_rules.map((_, i) => {
        const base = i * 6;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      }).join(', ');

      const params = output.triggered_rules.flatMap(r => [
        output.tx_id, r.rule_id, r.rule_name, r.rule_type, r.weight_applied, r.reason,
      ]);

      await pool.query(
        `INSERT INTO rule_evaluation_trace (tx_id, rule_id, rule_name, rule_type, weight_applied, reason)
         VALUES ${values}`,
        params
      );
    }

    console.log(`  Evaluated: ${output.decision} (score: ${output.risk_score}) — ${tx.tx_id}`);
  }

  console.log(`Evaluated ${unevaluated.length} seeded transactions.`);
}

async function run() {
  console.log('Seeding users...');
  await seedUsers();
  console.log(`Seeded ${users.length} users.`);
  await seedTransactions();
  await evaluateSeededTransactions();
}

run()
  .catch(err => { console.error('Transaction seeding failed:', err); process.exit(1); })
  .finally(() => pool.end());
