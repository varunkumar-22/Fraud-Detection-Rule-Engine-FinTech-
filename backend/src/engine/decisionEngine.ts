import pool from '../db/client';
import { FraudRule } from '../types/rule.types';
import { Transaction } from '../types/transaction.types';
import { EvaluationResult, TriggeredRule } from '../types/decision.types';
import { evaluateRule } from './ruleEvaluator';
import { getVelocityData } from './velocityChecker';
import { aggregateScore, makeDecision } from './scoreAggregator';
import { generateExplanation, ExplainableOutput } from './explainabilityGenerator';

const ALERT_SCORE_THRESHOLD = 70; // same as BLOCK threshold

// Check if this transaction has already been evaluated (idempotency)
export async function isAlreadyEvaluated(txId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM risk_logs WHERE tx_id = $1 LIMIT 1`,
    [txId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// Main orchestrator — runs the full fraud evaluation pipeline for one transaction
export async function runEvaluation(
  tx: Transaction,
  rules: FraudRule[]
): Promise<ExplainableOutput> {

  // Step 1 — Idempotency check: don't re-evaluate the same transaction
  const alreadyDone = await isAlreadyEvaluated(tx.tx_id);
  if (alreadyDone) {
    throw new Error(`Transaction ${tx.tx_id} has already been evaluated`);
  }

  // Step 2 — Get velocity data for this user (DB query)
  const velocityData = await getVelocityData(tx.user_id, new Date(tx.transaction_time));

  // Step 3 — Evaluate each rule in priority order
  const triggeredRules: TriggeredRule[] = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, tx, velocityData);
    if (result.triggered) {
      triggeredRules.push({
        rule_id:       rule.rule_id,
        rule_name:     rule.rule_name,
        rule_type:     rule.rule_type,
        weight_applied: rule.weight,
        reason:        result.reason,
      });
    }
  }

  // Step 4 — Aggregate score and make decision
  const risk_score        = aggregateScore(triggeredRules);
  const decision          = makeDecision(risk_score);
  const is_alert_generated = risk_score >= ALERT_SCORE_THRESHOLD;

  // Step 5 — Build evaluation result
  const evaluationResult: EvaluationResult = {
    tx_id:            tx.tx_id,
    risk_score,
    decision,
    triggered_rules:  triggeredRules,
    evaluation_time:  new Date(),
    is_alert_generated,
  };

  // Step 6 — Return explainable output
  return generateExplanation(evaluationResult);
}
