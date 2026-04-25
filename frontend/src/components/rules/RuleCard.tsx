import type { FraudRule } from '../../types';

interface RuleCardProps {
  rule:     FraudRule;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

const typeColor: Record<string, string> = {
  threshold: '#3b82f6',
  velocity:  '#8b5cf6',
  temporal:  '#f59e0b',
};

export default function RuleCard({ rule, onToggle, onDelete }: RuleCardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0',
      padding: '1.25rem', opacity: rule.is_active ? 1 : 0.6,
      borderLeft: `4px solid ${typeColor[rule.rule_type] ?? '#64748b'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{rule.rule_name}</span>
            <span style={{
              background: typeColor[rule.rule_type] + '20',
              color: typeColor[rule.rule_type],
              fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px',
              borderRadius: '4px', textTransform: 'uppercase',
            }}>
              {rule.rule_type}
            </span>
            {!rule.is_active && (
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                DISABLED
              </span>
            )}
          </div>
          {rule.description && (
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#64748b' }}>{rule.description}</p>
          )}
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: '#475569' }}>
            <span><b>Field:</b> {rule.field_name}</span>
            <span><b>Op:</b> {rule.operator}</span>
            <span><b>Value:</b> {rule.threshold_value}</span>
            <span><b>Weight:</b> {rule.weight}</span>
            <span><b>Priority:</b> {rule.priority}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
          <button
            onClick={() => onToggle(rule.rule_id, !rule.is_active)}
            style={{
              padding: '4px 10px', fontSize: '0.75rem', borderRadius: '5px', cursor: 'pointer',
              border: '1px solid #e2e8f0',
              background: rule.is_active ? '#fef3c7' : '#d1fae5',
              color: rule.is_active ? '#92400e' : '#065f46',
            }}
          >
            {rule.is_active ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={() => { if (window.confirm(`Delete "${rule.rule_name}"?`)) onDelete(rule.rule_id); }}
            style={{
              padding: '4px 10px', fontSize: '0.75rem', borderRadius: '5px', cursor: 'pointer',
              border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
