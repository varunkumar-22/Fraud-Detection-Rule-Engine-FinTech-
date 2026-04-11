// Decision types — matches risk_logs and triggered_rules table schema

export type Decision = 'ALLOW' | 'REVIEW' | 'BLOCK';

// A single rule that triggered during evaluation
export interface TriggeredRule {
  rule_id: string;
  rule_name: string;
  rule_type: string;
  weight_applied: number;
  reason: string; // human-readable explanation e.g. "amount (15000) gt 10000"
}

// Full result of evaluating one transaction through the engine
export interface EvaluationResult {
  tx_id: string;
  risk_score: number;
  decision: Decision;
  triggered_rules: TriggeredRule[];
  evaluation_time: Date;
  is_alert_generated: boolean;
}
