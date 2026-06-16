import { useState } from 'react';
import Navbar from '../components/shared/Navbar';
import SimulateForm from '../components/simulate/SimulateForm';
import SimulationResult from '../components/simulate/SimulationResult';
import ScenarioSelector from '../components/simulate/ScenarioSelector';
import { simulate } from '../services/api';
import type { SimulationResult as ISimulationResult, SimulateInput } from '../types';

export default function Simulate() {
  const [result, setResult]     = useState<ISimulationResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [prefill, setPrefill]   = useState<Partial<SimulateInput>>({});

  const handleSubmit = async (data: SimulateInput) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await simulate(data);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleScenario = (data: SimulateInput) => {
    setPrefill(data);
    setResult(null);
    setError('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Navbar title="Verify a Payment" />
      <div style={{ padding: '1.5rem', flex: 1, maxWidth: '680px' }}>
        <p style={{ margin: '0 0 1.25rem', color: '#64748b', fontSize: '0.88rem' }}>
          Enter your payment details below to check how verified it is against the active fraud rules.
          Nothing is stored — this is a simulation only.
        </p>

        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <ScenarioSelector onSelect={handleScenario} />
            </div>
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#1e293b' }}>Payment Details</h3>
              {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.82rem' }}>{error}</div>}
              <SimulateForm initial={prefill} onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>
        ) : (
          <SimulationResult result={result} onReset={() => { setResult(null); setPrefill({}); }} />
        )}
      </div>
    </div>
  );
}
