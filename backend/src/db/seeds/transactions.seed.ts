import pool from '../client';

// Seed users first so the foreign key on transactions is satisfied
const users = [
  { user_id: 'a1b2c3d4-0001-0001-0001-000000000001', email: 'alice@example.com',   name: 'Alice' },
  { user_id: 'a1b2c3d4-0002-0002-0002-000000000002', email: 'bob@example.com',     name: 'Bob' },
  { user_id: 'a1b2c3d4-0003-0003-0003-000000000003', email: 'charlie@example.com', name: 'Charlie' },
];

// Transactions designed to exercise every decision outcome
// Each group maps to one of the three scenario test files
const transactions = [

  // --- Scenario: Large Amount → BLOCK (High Amount Block weight 70 + Medium Amount Review weight 30 = 100) ---
  {
    user_id:          'a1b2c3d4-0001-0001-0001-000000000001',
    amount:           85000,
    location:         'US',
    device_id:        'device-alice-001',
    transaction_time: '2026-04-12T14:00:00Z',  // 2 PM — normal hours, only amount rules fire
    is_simulation:    false,
    label:            'BLOCK — large amount (₹85,000)',
  },

  // --- Scenario: Large Amount → ALLOW (Safe Amount weight 10, score < 30) ---
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
    transaction_time: '2026-04-12T02:30:00Z',  // 2:30 AM UTC — night hour rule fires
    is_simulation:    false,
    label:            'BLOCK — night transaction with medium amount',
  },

  // --- Scenario: Night Time → REVIEW (only Medium Amount weight 30 fires — daytime) ---
  {
    user_id:          'a1b2c3d4-0002-0002-0002-000000000002',
    amount:           8000,
    location:         'US',
    device_id:        'device-bob-001',
    transaction_time: '2026-04-12T10:00:00Z',  // 10 AM UTC — no night rule, only amount rule
    is_simulation:    false,
    label:            'REVIEW — daytime medium amount',
  },

  // --- Scenario: Rapid Velocity — base transaction (velocity data provided separately in tests) ---
  {
    user_id:          'a1b2c3d4-0003-0003-0003-000000000003',
    amount:           2000,
    location:         'IN',
    device_id:        'device-charlie-001',
    transaction_time: '2026-04-12T14:00:00Z',
    is_simulation:    false,
    label:            'base transaction — BLOCK when velocity is high',
  },

  // --- Simulation example — safe, used for frontend demo ---
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
      [
        tx.user_id,
        tx.amount,
        tx.location,
        tx.device_id,
        new Date(tx.transaction_time),
        tx.is_simulation,
      ]
    );
    console.log(`  Seeded tx: ${tx.label}`);
  }

  console.log(`Seeded ${transactions.length} transactions.`);
}

async function run() {
  console.log('Seeding users...');
  await seedUsers();
  console.log(`Seeded ${users.length} users.`);
  await seedTransactions();
}

run()
  .catch(err => { console.error('Transaction seeding failed:', err); process.exit(1); })
  .finally(() => pool.end());
