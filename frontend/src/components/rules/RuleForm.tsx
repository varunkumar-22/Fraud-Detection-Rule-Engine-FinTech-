import { useState } from 'react';
import type { CreateRuleInput, RuleType, Operator } from '../../types';

interface RuleFormProps {
  onSubmit: (data: CreateRuleInput) => Promise<void>;
  onCancel: () => void;
}

const ruleTypes: RuleType[]  = ['threshold', 'velocity', 'temporal'];
const operators: Operator[]  = ['gt', 'lt', 'gte', 'lte', 'eq', 'neq', 'in', 'not_in', 'range', 'regex'];

const blank: CreateRuleInput = {
  rule_name: '', description: '', rule_type: 'threshold',
  field_name: '', operator: 'gt', threshold_value: '', weight: 30, priority: 10,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box',
};

export default function RuleForm({ onSubmit, onCancel }: RuleFormProps) {
  const [form, setForm] = useState<CreateRuleInput>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof CreateRuleInput, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await onSubmit({ ...form, weight: Number(form.weight), priority: Number(form.priority) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.6rem', borderRadius: '6px', fontSize: '0.82rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Rule Name *
          <input style={inputStyle} value={form.rule_name} onChange={e => set('rule_name', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Rule Type *
          <select style={inputStyle} value={form.rule_type} onChange={e => set('rule_type', e.target.value as RuleType)}>
            {ruleTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Field Name *
          <input style={inputStyle} placeholder="e.g. amount, hour_of_day, tx_count_1h" value={form.field_name} onChange={e => set('field_name', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Operator *
          <select style={inputStyle} value={form.operator} onChange={e => set('operator', e.target.value as Operator)}>
            {operators.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Threshold Value *
          <input style={inputStyle} placeholder="e.g. 10000 or US,UK or 0,1,2,3" value={form.threshold_value} onChange={e => set('threshold_value', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Weight (1–100) *
          <input style={inputStyle} type="number" min={1} max={100} value={form.weight} onChange={e => set('weight', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Priority
          <input style={inputStyle} type="number" min={1} value={form.priority} onChange={e => set('priority', e.target.value)} />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
        Description
        <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} />
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          {saving ? 'Saving…' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}
