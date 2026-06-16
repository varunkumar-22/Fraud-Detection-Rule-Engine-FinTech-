export type Decision = 'ALLOW' | 'REVIEW' | 'BLOCK';
export type RuleType = 'threshold' | 'velocity' | 'temporal';
export type Operator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'in' | 'not_in' | 'range' | 'regex';

export interface FraudRule {
  rule_id:         string;
  rule_name:       string;
  description:     string | null;
  rule_type:       RuleType;
  field_name:      string;
  operator:        Operator;
  threshold_value: string;
  weight:          number;
  priority:        number;
  is_active:       boolean;
  created_at:      string;
  updated_at:      string;
}

export interface TriggeredRule {
  rule_id:        string;
  rule_name:      string;
  rule_type:      string;
  weight_applied: number;
  reason:         string;
}

export interface ScoreBreakdownItem {
  rule_name: string;
  weight:    number;
  reason:    string;
}

export interface SimulationResult {
  tx_id:              string;
  decision:           Decision;
  risk_score:         number;
  triggered_rules:    TriggeredRule[];
  score_breakdown:    ScoreBreakdownItem[];
  evaluation_time:    string;
  is_alert_generated: boolean;
}

export interface EvaluationSummary {
  id:                 string;
  tx_id:              string;
  risk_score:         number;
  decision:           Decision;
  is_alert_generated: boolean;
  evaluation_time:    string;
  triggered_rules:    { rule_name: string; rule_type: string; reason: string }[];
}

export interface SimulateInput {
  user_id:          string;
  amount:           number;
  location:         string;
  device_id:        string;
  transaction_time?: string;
}

export interface CreateRuleInput {
  rule_name:       string;
  description?:    string;
  rule_type:       RuleType;
  field_name:      string;
  operator:        Operator;
  threshold_value: string;
  weight:          number;
  priority?:       number;
}
