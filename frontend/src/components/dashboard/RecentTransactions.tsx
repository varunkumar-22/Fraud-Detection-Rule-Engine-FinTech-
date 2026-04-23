import type { EvaluationSummary } from '../../types';
import Badge from '../shared/Badge';

interface RecentTransactionsProps {
  results: EvaluationSummary[];
}

export default function RecentTransactions({ results }: RecentTransactionsProps) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
          Recent Evaluations
        </h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['Transaction ID', 'Decision', 'Risk Score', 'Alert', 'Time'].map(h => (
              <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.slice(0, 10).map(r => (
            <tr key={r.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.65rem 1rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {r.tx_id.slice(0, 8)}…
              </td>
              <td style={{ padding: '0.65rem 1rem' }}>
                <Badge decision={r.decision} />
              </td>
              <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: r.risk_score >= 70 ? '#ef4444' : r.risk_score >= 30 ? '#f59e0b' : '#10b981' }}>
                {r.risk_score}
              </td>
              <td style={{ padding: '0.65rem 1rem' }}>
                {r.is_alert_generated ? '🔴' : '—'}
              </td>
              <td style={{ padding: '0.65rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                {new Date(r.evaluation_time).toLocaleString()}
              </td>
            </tr>
          ))}
          {results.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No evaluations yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
