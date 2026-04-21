import pool from '../db/client';
import { Transaction } from '../types/transaction.types';
import { TransactionInputDTO } from '../schemas/transaction.schema';
import { loadActiveRules } from '../engine/ruleLoader';
import { runEvaluation } from '../engine/decisionEngine';
import { ExplainableOutput } from '../engine/explainabilityGenerator';
import { triggerAlert } from '../utils/alerting';
import { logger } from '../utils/logger';

// Persist the raw transaction row and return the full Transaction object
async function insertTransaction(input: TransactionInputDTO): Promise<Transaction> {
  const result = await pool.query<Transaction>(
    `INSERT INTO transactions (user_id, amount, location, device_id, transaction_time, is_simulation)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.user_id,
      input.amount,
      input.location,
      input.device_id,
      input.transaction_time ? new Date(input.transaction_time) : new Date(),
      input.is_simulation ?? false,
    ]
  );
  return result.rows[0];
}

// Persist the evaluation result into risk_logs and rule_evaluation_trace
async function persistEvaluation(output: ExplainableOutput): Promise<void> {
  await pool.query(
    `INSERT INTO risk_logs (tx_id, risk_score, decision, is_alert_generated, evaluation_time)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      output.tx_id,
      output.risk_score,
      output.decision,
      output.is_alert_generated,
      new Date(output.evaluation_time),
    ]
  );

  if (output.triggered_rules.length > 0) {
    const values = output.triggered_rules.map((_, i) => {
      const base = i * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');

    const params = output.triggered_rules.flatMap(r => [
      output.tx_id,
      r.rule_id,
      r.rule_name,
      r.rule_type,
      r.reason,
    ]);

    await pool.query(
      `INSERT INTO rule_evaluation_trace (tx_id, rule_id, rule_name, rule_type, reason)
       VALUES ${values}`,
      params
    );
  }
}

// Main service function — called by the controller
export async function evaluateTransaction(
  input: TransactionInputDTO
): Promise<ExplainableOutput> {
  const tx    = await insertTransaction(input);
  const rules = await loadActiveRules();

  logger.info('Evaluating transaction', { tx_id: tx.tx_id, rules_loaded: rules.length });

  const output = await runEvaluation(tx, rules);

  await persistEvaluation(output);

  if (output.is_alert_generated) {
    triggerAlert(output);
  }

  return output;
}
