import type { FraudRule } from '../../types';
import RuleCard from './RuleCard';

interface RulesListProps {
  rules:    FraudRule[];
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}

export default function RulesList({ rules, onToggle, onDelete }: RulesListProps) {
  if (rules.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        No rules found. Create your first rule above.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {rules.map(rule => (
        <RuleCard key={rule.rule_id} rule={rule} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  );
}
