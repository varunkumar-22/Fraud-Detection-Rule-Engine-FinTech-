// Rule types — matches fraud_rules table schema

export type RuleType = 'threshold' | 'velocity' | 'temporal';

export type Operator =
  | 'gt'      // greater than        >
  | 'lt'      // less than           <
  | 'gte'     // greater or equal    >=
  | 'lte'     // less or equal       <=
  | 'eq'      // equal               ==
  | 'neq'     // not equal           !=
  | 'in'      // value in set        e.g. threshold_value: "US,UK,CA"
  | 'not_in'  // value not in set
  | 'range'   // between min and max e.g. threshold_value: "100-5000"
  | 'regex';  // regex match for string fields

export interface FraudRule {
  rule_id: string;
  rule_name: string;
  rule_type: RuleType;
  field_name: string;       // e.g. 'amount', 'location', 'hour_of_day', 'tx_count_1h'
  operator: Operator;
  threshold_value: string;  // stored as string in DB, parsed at evaluation time
  weight: number;           // 1–100, contribution to risk score
  priority: number;         // lower number = evaluated first
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}
