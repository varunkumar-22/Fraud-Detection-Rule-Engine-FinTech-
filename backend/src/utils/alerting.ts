import { logger } from './logger';
import { ExplainableOutput } from '../engine/explainabilityGenerator';

export function triggerAlert(output: ExplainableOutput): void {
  logger.warn('FRAUD ALERT', {
    tx_id:          output.tx_id,
    decision:       output.decision,
    risk_score:     output.risk_score,
    triggered_rules: output.triggered_rules.map(r => r.rule_name),
  });
}
