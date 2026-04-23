import pool from '../db/client';

export interface EvaluationSummary {
  id:                 string;
  tx_id:              string;
  risk_score:         number;
  decision:           string;
  is_alert_generated: boolean;
  evaluation_time:    Date;
  triggered_rules:    { rule_name: string; rule_type: string; reason: string }[];
}

// GET paginated list of all evaluation results
export async function getResults(
  limit = 20,
  offset = 0,
  decision?: string
): Promise<{ results: EvaluationSummary[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[]    = [];
  let idx = 1;

  if (decision) {
    conditions.push(`rl.decision = $${idx++}`);
    params.push(decision.toUpperCase());
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM risk_logs rl ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);

  const result = await pool.query<EvaluationSummary>(
    `SELECT
       rl.id, rl.tx_id, rl.risk_score, rl.decision,
       rl.is_alert_generated, rl.evaluation_time,
       COALESCE(
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'rule_name', ret.rule_name,
             'rule_type', ret.rule_type,
             'reason',    ret.reason
           )
         ) FILTER (WHERE ret.rule_name IS NOT NULL),
         '[]'
       ) AS triggered_rules
     FROM risk_logs rl
     LEFT JOIN rule_evaluation_trace ret ON ret.tx_id = rl.tx_id
     ${where}
     GROUP BY rl.id
     ORDER BY rl.evaluation_time DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  return { results: result.rows, total };
}

// GET single evaluation result by tx_id
export async function getResultByTxId(txId: string): Promise<EvaluationSummary | null> {
  const result = await pool.query<EvaluationSummary>(
    `SELECT
       rl.id, rl.tx_id, rl.risk_score, rl.decision,
       rl.is_alert_generated, rl.evaluation_time,
       COALESCE(
         JSON_AGG(
           JSON_BUILD_OBJECT(
             'rule_name', ret.rule_name,
             'rule_type', ret.rule_type,
             'reason',    ret.reason
           )
         ) FILTER (WHERE ret.rule_name IS NOT NULL),
         '[]'
       ) AS triggered_rules
     FROM risk_logs rl
     LEFT JOIN rule_evaluation_trace ret ON ret.tx_id = rl.tx_id
     WHERE rl.tx_id = $1
     GROUP BY rl.id`,
    [txId]
  );
  return result.rows[0] ?? null;
}
