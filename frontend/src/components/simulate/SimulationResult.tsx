import type { SimulationResult } from '../../types';
import Badge from '../shared/Badge';

interface SimulationResultProps {
  result: SimulationResult;
  onReset: () => void;
}

const decisionConfig = {
  ALLOW:  { icon: '✅', title: 'Payment Verified',      bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
  REVIEW: { icon: '⚠️', title: 'Payment Needs Review',  bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  BLOCK:  { icon: '🚫', title: 'Payment Blocked',        bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
};

export default function SimulationResult({ result, onReset }: SimulationResultProps) {
  const cfg = decisionConfig[result.decision as keyof typeof decisionConfig];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '10px',
        padding: '1.5rem', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{cfg.icon}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: cfg.text }}>{cfg.title}</div>
        <div style={{ fontSize: '0.85rem', color: cfg.text, marginTop: '0.25rem', opacity: 0.8 }}>
          Risk Score: <strong>{result.risk_score}</strong> / 100
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <Badge decision={result.decision as 'ALLOW' | 'REVIEW' | 'BLOCK'} />
        </div>
      </div>

      {result.score_breakdown.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
            Why this decision was made
          </div>
          {result.score_breakdown.map((item, i) => (
            <div key={i} style={{ padding: '0.75rem 1rem', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{item.rule_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{item.reason}</div>
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444', marginLeft: '1rem' }}>
                +{item.weight}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          No fraud rules triggered — this payment looks clean.
        </div>
      )}

      <button onClick={onReset} style={{
        padding: '0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0',
        background: '#fff', cursor: 'pointer', fontSize: '0.85rem', color: '#374151',
      }}>
        Check Another Payment
      </button>
    </div>
  );
}
