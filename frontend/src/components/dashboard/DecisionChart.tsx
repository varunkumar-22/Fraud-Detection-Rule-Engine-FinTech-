import type { EvaluationSummary } from '../../types';

interface DecisionChartProps {
  results: EvaluationSummary[];
}

export default function DecisionChart({ results }: DecisionChartProps) {
  const counts = { ALLOW: 0, REVIEW: 0, BLOCK: 0 };
  results.forEach(r => { counts[r.decision] = (counts[r.decision] ?? 0) + 1; });
  const total = results.length || 1;

  const bars = [
    { label: 'ALLOW',  count: counts.ALLOW,  color: '#10b981' },
    { label: 'REVIEW', count: counts.REVIEW, color: '#f59e0b' },
    { label: 'BLOCK',  count: counts.BLOCK,  color: '#ef4444' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
      <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
        Decision Breakdown
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{b.label}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.count}</span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '8px' }}>
              <div style={{
                width: `${(b.count / total) * 100}%`,
                background: b.color, height: '8px', borderRadius: '4px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
