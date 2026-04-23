import pool from '../db/client';
import { FraudRule } from '../types/rule.types';
import { CreateRuleDTO, UpdateRuleDTO, ToggleRuleDTO } from '../schemas/rule.schema';

// GET all rules (active + inactive), ordered by priority
export async function getAllRules(): Promise<FraudRule[]> {
  const result = await pool.query<FraudRule>(
    `SELECT rule_id, rule_name, description, rule_type, field_name, operator,
            threshold_value, weight, priority, is_active, created_by, created_at, updated_at
     FROM fraud_rules
     ORDER BY priority ASC, created_at DESC`
  );
  return result.rows;
}

// GET one rule by ID
export async function getRuleById(ruleId: string): Promise<FraudRule | null> {
  const result = await pool.query<FraudRule>(
    `SELECT rule_id, rule_name, description, rule_type, field_name, operator,
            threshold_value, weight, priority, is_active, created_by, created_at, updated_at
     FROM fraud_rules
     WHERE rule_id = $1`,
    [ruleId]
  );
  return result.rows[0] ?? null;
}

// POST create a new rule
export async function createRule(data: CreateRuleDTO): Promise<FraudRule> {
  const result = await pool.query<FraudRule>(
    `INSERT INTO fraud_rules
       (rule_name, description, rule_type, field_name, operator, threshold_value, weight, priority)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING rule_id, rule_name, description, rule_type, field_name, operator,
               threshold_value, weight, priority, is_active, created_by, created_at, updated_at`,
    [
      data.rule_name,
      data.description ?? null,
      data.rule_type,
      data.field_name,
      data.operator,
      data.threshold_value,
      data.weight,
      data.priority ?? 10,
    ]
  );
  return result.rows[0];
}

// PUT update an existing rule's fields
export async function updateRule(ruleId: string, data: UpdateRuleDTO): Promise<FraudRule | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.rule_name       !== undefined) { fields.push(`rule_name = $${idx++}`);       values.push(data.rule_name); }
  if (data.description     !== undefined) { fields.push(`description = $${idx++}`);     values.push(data.description); }
  if (data.rule_type       !== undefined) { fields.push(`rule_type = $${idx++}`);       values.push(data.rule_type); }
  if (data.field_name      !== undefined) { fields.push(`field_name = $${idx++}`);      values.push(data.field_name); }
  if (data.operator        !== undefined) { fields.push(`operator = $${idx++}`);        values.push(data.operator); }
  if (data.threshold_value !== undefined) { fields.push(`threshold_value = $${idx++}`); values.push(data.threshold_value); }
  if (data.weight          !== undefined) { fields.push(`weight = $${idx++}`);          values.push(data.weight); }
  if (data.priority        !== undefined) { fields.push(`priority = $${idx++}`);        values.push(data.priority); }

  if (fields.length === 0) return getRuleById(ruleId);

  fields.push(`updated_at = NOW()`);
  values.push(ruleId);

  const result = await pool.query<FraudRule>(
    `UPDATE fraud_rules SET ${fields.join(', ')} WHERE rule_id = $${idx}
     RETURNING rule_id, rule_name, description, rule_type, field_name, operator,
               threshold_value, weight, priority, is_active, created_by, created_at, updated_at`,
    values
  );
  return result.rows[0] ?? null;
}

// PATCH toggle is_active (enable / disable)
export async function toggleRule(ruleId: string, data: ToggleRuleDTO): Promise<FraudRule | null> {
  const result = await pool.query<FraudRule>(
    `UPDATE fraud_rules SET is_active = $1, updated_at = NOW()
     WHERE rule_id = $2
     RETURNING rule_id, rule_name, description, rule_type, field_name, operator,
               threshold_value, weight, priority, is_active, created_by, created_at, updated_at`,
    [data.is_active, ruleId]
  );
  return result.rows[0] ?? null;
}

// DELETE a rule permanently
export async function deleteRule(ruleId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM fraud_rules WHERE rule_id = $1`,
    [ruleId]
  );
  return (result.rowCount ?? 0) > 0;
}
