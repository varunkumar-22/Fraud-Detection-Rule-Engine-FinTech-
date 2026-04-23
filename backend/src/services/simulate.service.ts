import { randomUUID } from 'crypto';
import { Transaction } from '../types/transaction.types';
import { SimulateInputDTO } from '../schemas/simulate.schema';
import { loadActiveRules } from '../engine/ruleLoader';
import { getVelocityData } from '../engine/velocityChecker';
import { evaluateRule } from '../engine/ruleEvaluator';
import { aggregateScore, makeDecision } from '../engine/scoreAggregator';
import { generateExplanation, ExplainableOutput } from '../engine/explainabilityGenerator';
import { EvaluationResult, TriggeredRule } from '../types/decision.types';
import { logger } from '../utils/logger';

const ALERT_SCORE_THRESHOLD = 70;

export async function simulateTransaction(input: SimulateInputDTO): Promise<ExplainableOutput> {
  // Build a transient Transaction object — never written to the DB
  const tx: Transaction = {
    tx_id:            randomUUID(),
    user_id:          input.user_id,
    amount:           input.amount,
    location:         input.location,
    device_id:        input.device_id,
    transaction_time: input.transaction_time ? new Date(input.transaction_time) : new Date(),
    is_simulation:    true,   // velocityChecker excludes simulations from historical counts
    created_at:       new Date(),
  };

  const rules = await loadActiveRules();

  // Velocity data still uses real history so the simulation reflects actual user context
  const velocityData = await getVelocityData(tx.user_id, tx.transaction_time);

  logger.info('Simulating transaction', { tx_id: tx.tx_id, rules_loaded: rules.length });

  const triggeredRules: TriggeredRule[] = [];

  for (const rule of rules) {
    const result = evaluateRule(rule, tx, velocityData);
    if (result.triggered) {
      triggeredRules.push({
        rule_id:        rule.rule_id,
        rule_name:      rule.rule_name,
        rule_type:      rule.rule_type,
        weight_applied: rule.weight,
        reason:         result.reason,
      });
    }
  }

  const risk_score         = aggregateScore(triggeredRules);
  const decision           = makeDecision(risk_score);
  const is_alert_generated = risk_score >= ALERT_SCORE_THRESHOLD;

  const evaluationResult: EvaluationResult = {
    tx_id:           tx.tx_id,
    risk_score,
    decision,
    triggered_rules:  triggeredRules,
    evaluation_time:  new Date(),
    is_alert_generated,
  };

  return generateExplanation(evaluationResult);
}
