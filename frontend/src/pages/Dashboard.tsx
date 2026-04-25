import { useEffect, useState } from 'react';
import Navbar from '../components/shared/Navbar';
import StatsCard from '../components/dashboard/StatsCard';
import DecisionChart from '../components/dashboard/DecisionChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { getResults } from '../services/api';
import type { EvaluationSummary } from '../types';

export default function Dashboard() {
  const [results, setResults] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getResults({ limit: 50 })
      .then(({ results }) => setResults(results))
      .catch(() => setError('Could not load evaluation data'))
      .finally(() => setLoading(false));
  }, []);

  const counts = { ALLOW: 0, REVIEW: 0, BLOCK: 0 };
  results.forEach(r => { counts[r.decision] = (counts[r.decision] ?? 0) + 1; });
  const alerts = results.filter(r => r.is_alert_generated).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Dashboard" />
      <div style={{ padding: '1.5rem', flex: 1 }}>
        {loading && <LoadingSpinner />}
        {error && <div style={{ color: '#991b1b', background: '#fee2e2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}
        {!loading && (
          <>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <StatsCard label="Total Evaluated"  value={results.length}   color="#3b82f6" />
              <StatsCard label="Allowed"           value={counts.ALLOW}    color="#10b981" />
              <StatsCard label="Under Review"      value={counts.REVIEW}   color="#f59e0b" />
              <StatsCard label="Blocked"           value={counts.BLOCK}    color="#ef4444" />
              <StatsCard label="Alerts Generated"  value={alerts}          color="#8b5cf6" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <DecisionChart results={results} />
              <div />
            </div>
            <RecentTransactions results={results} />
          </>
        )}
      </div>
    </div>
  );
}
