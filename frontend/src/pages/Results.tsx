import { useEffect, useState } from 'react';
import Navbar from '../components/shared/Navbar';
import Badge from '../components/shared/Badge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getResults } from '../services/api';
import type { EvaluationSummary, Decision } from '../types';

const PAGE_SIZE = 15;

export default function Results() {
  const [results, setResults]     = useState<EvaluationSummary[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);
  const [filter, setFilter]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    setLoading(true);
    getResults({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, decision: filter || undefined })
      .then(({ results, total }) => { setResults(results); setTotal(total); })
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [page, filter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Evaluation Results" />
      <div style={{ padding: '1.5rem', flex: 1 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Filter:</span>
          {['', 'ALLOW', 'REVIEW', 'BLOCK'].map(d => (
            <button key={d} onClick={() => { setFilter(d); setPage(0); }} style={{
              padding: '4px 12px', borderRadius: '5px', fontSize: '0.78rem', cursor: 'pointer',
              border: '1px solid #e2e8f0',
              background: filter === d ? '#3b82f6' : '#fff',
              color: filter === d ? '#fff' : '#374151', fontWeight: filter === d ? 600 : 400,
            }}>
              {d || 'All'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94a3b8' }}>
            {total} total results
          </span>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Transaction ID', 'Decision', 'Risk Score', 'Rules Triggered', 'Alert', 'Evaluated At'].map(h => (
                    <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', background: expanded === r.id ? '#f8fafc' : '#fff' }}
                    >
                      <td style={{ padding: '0.7rem 1rem', fontFamily: 'monospace', color: '#3b82f6', fontSize: '0.75rem' }}>
                        {r.tx_id.slice(0, 12)}…
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}><Badge decision={r.decision as Decision} /></td>
                      <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: r.risk_score >= 70 ? '#ef4444' : r.risk_score >= 30 ? '#f59e0b' : '#10b981' }}>
                        {r.risk_score}
                      </td>
                      <td style={{ padding: '0.7rem 1rem', color: '#475569' }}>
                        {r.triggered_rules.length}
                      </td>
                      <td style={{ padding: '0.7rem 1rem' }}>{r.is_alert_generated ? '🔴' : '—'}</td>
                      <td style={{ padding: '0.7rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                        {new Date(r.evaluation_time).toLocaleString()}
                      </td>
                    </tr>
                    {expanded === r.id && r.triggered_rules.length > 0 && (
                      <tr key={`${r.id}-detail`} style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                        <td colSpan={6} style={{ padding: '0.75rem 1rem 1rem 2rem' }}>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>Triggered Rules:</div>
                          {r.triggered_rules.map((tr, i) => (
                            <div key={i} style={{ fontSize: '0.78rem', color: '#475569', padding: '2px 0' }}>
                              <b>{tr.rule_name}</b> ({tr.rule_type}) — {tr.reason}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 12px', borderRadius: '5px', border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff' }}>
              Prev
            </button>
            <span style={{ padding: '4px 8px', fontSize: '0.82rem', color: '#64748b' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 12px', borderRadius: '5px', border: '1px solid #e2e8f0', cursor: 'pointer', background: '#fff' }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
