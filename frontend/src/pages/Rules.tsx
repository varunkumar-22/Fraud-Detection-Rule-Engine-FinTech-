import { useEffect, useState } from 'react';
import Navbar from '../components/shared/Navbar';
import RulesList from '../components/rules/RulesList';
import RuleForm from '../components/rules/RuleForm';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getRules, createRule, toggleRule, deleteRule } from '../services/api';
import type { FraudRule, CreateRuleInput } from '../types';

export default function Rules() {
  const [rules, setRules]       = useState<FraudRule[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');

  const load = () => {
    setLoading(true);
    getRules()
      .then(setRules)
      .catch(() => setError('Failed to load rules'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (data: CreateRuleInput) => {
    await createRule(data);
    setShowForm(false);
    load();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await toggleRule(id, active);
    setRules(prev => prev.map(r => r.rule_id === id ? { ...r, is_active: active } : r));
  };

  const handleDelete = async (id: string) => {
    await deleteRule(id);
    setRules(prev => prev.filter(r => r.rule_id !== id));
  };

  const active   = rules.filter(r => r.is_active).length;
  const inactive = rules.length - active;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Fraud Rules" />
      <div style={{ padding: '1.5rem', flex: 1 }}>
        {error && <div style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {rules.length} rules &nbsp;·&nbsp;
            <span style={{ color: '#10b981' }}>{active} active</span>
            &nbsp;·&nbsp;
            <span style={{ color: '#94a3b8' }}>{inactive} disabled</span>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              background: showForm ? '#e2e8f0' : '#3b82f6', color: showForm ? '#374151' : '#fff',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            }}
          >
            {showForm ? 'Cancel' : '+ New Rule'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#1e293b' }}>Create New Rule</h3>
            <RuleForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {loading ? <LoadingSpinner /> : <RulesList rules={rules} onToggle={handleToggle} onDelete={handleDelete} />}
      </div>
    </div>
  );
}
