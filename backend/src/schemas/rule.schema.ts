import { z } from 'zod';

const ruleTypes    = ['threshold', 'velocity', 'temporal'] as const;
const operators    = ['gt', 'lt', 'gte', 'lte', 'eq', 'neq', 'in', 'not_in', 'range', 'regex'] as const;

export const createRuleSchema = z.object({
  rule_name:       z.string().min(1,  { message: 'rule_name is required' }),
  description:     z.string().optional(),
  rule_type:       z.enum(ruleTypes,  { message: 'rule_type must be threshold, velocity, or temporal' }),
  field_name:      z.string().min(1,  { message: 'field_name is required' }),
  operator:        z.enum(operators,  { message: 'invalid operator' }),
  threshold_value: z.string().min(1,  { message: 'threshold_value is required' }),
  weight:          z.number().int().min(1).max(100, { message: 'weight must be between 1 and 100' }),
  priority:        z.number().int().min(1).optional().default(10),
});

export const updateRuleSchema = createRuleSchema.partial();

export const toggleRuleSchema = z.object({
  is_active: z.boolean({ message: 'is_active must be a boolean' }),
});

export type CreateRuleDTO  = z.infer<typeof createRuleSchema>;
export type UpdateRuleDTO  = z.infer<typeof updateRuleSchema>;
export type ToggleRuleDTO  = z.infer<typeof toggleRuleSchema>;
