import pool from '../client';

const rules = [
  // --- Threshold rules ---
  {
    rule_name:       'High Amount Block',
    description:     'Blocks transactions above ₹50,000 — high risk of fraud',
    rule_type:       'threshold',
    field_name:      'amount',
    operator:        'gt',
    threshold_value: '50000',
    weight:          70,
    priority:        1,
  },
  {
    rule_name:       'Medium Amount Review',
    description:     'Flags transactions above ₹10,000 for manual review',
    rule_type:       'threshold',
    field_name:      'amount',
    operator:        'gt',
    threshold_value: '10000',
    weight:          30,
    priority:        2,
  },
  {
    rule_name:       'Safe Amount',
    description:     'Low-value transactions under ₹5,000 are treated as low risk',
    rule_type:       'threshold',
    field_name:      'amount',
    operator:        'lte',
    threshold_value: '5000',
    weight:          10,
    priority:        3,
  },

  // --- Temporal rules ---
  {
    rule_name:       'Night Hour Transaction',
    description:     'Flags transactions between 10 PM and 5 AM UTC as suspicious',
    rule_type:       'temporal',
    field_name:      'hour_of_day',
    operator:        'in',
    threshold_value: '0,1,2,3,4,5,22,23',
    weight:          40,
    priority:        4,
  },

  // --- Velocity rules ---
  {
    rule_name:       'High Transaction Frequency 1h',
    description:     'More than 5 transactions in the last hour from the same user',
    rule_type:       'velocity',
    field_name:      'tx_count_1h',
    operator:        'gt',
    threshold_value: '5',
    weight:          50,
    priority:        5,
  },
  {
    rule_name:       'High Spend 1h',
    description:     'Total spend exceeds ₹10,000 within the last hour',
    rule_type:       'velocity',
    field_name:      'tx_amount_1h',
    operator:        'gt',
    threshold_value: '10000',
    weight:          30,
    priority:        6,
  },
  {
    rule_name:       'High Transaction Frequency 24h',
    description:     'More than 15 transactions in the last 24 hours from the same user',
    rule_type:       'velocity',
    field_name:      'tx_count_24h',
    operator:        'gt',
    threshold_value: '15',
    weight:          20,
    priority:        7,
  },
];

async function seedRules() {
  console.log('Seeding fraud rules...');

  for (const rule of rules) {
    await pool.query(
      `INSERT INTO fraud_rules
         (rule_name, description, rule_type, field_name, operator, threshold_value, weight, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (rule_name) DO NOTHING`,
      [
        rule.rule_name,
        rule.description,
        rule.rule_type,
        rule.field_name,
        rule.operator,
        rule.threshold_value,
        rule.weight,
        rule.priority,
      ]
    );
    console.log(`  Seeded rule: ${rule.rule_name}`);
  }

  console.log(`Seeded ${rules.length} fraud rules.`);
}

seedRules()
  .catch(err => { console.error('Rule seeding failed:', err); process.exit(1); })
  .finally(() => pool.end());
