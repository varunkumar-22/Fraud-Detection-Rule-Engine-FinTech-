import type { SimulateInput } from '../../types';

interface Scenario {
  label:       string;
  description: string;
  data:        SimulateInput;
}

const DEMO_USER = 'a1b2c3d4-0001-0001-0001-000000000001';

const scenarios: Scenario[] = [
  {
    label:       'Large Amount (BLOCK)',
    description: '₹85,000 transaction — triggers High Amount Block rule',
    data: { user_id: DEMO_USER, amount: 85000, location: 'US', device_id: 'device-demo' },
  },
  {
    label:       'Night Transaction (BLOCK)',
    description: '₹8,000 at 2:30 AM — triggers Night Hour + Medium Amount rules',
    data: { user_id: DEMO_USER, amount: 8000, location: 'US', device_id: 'device-demo', transaction_time: '2026-04-12T02:30:00Z' },
  },
  {
    label:       'Medium Amount (REVIEW)',
    description: '₹12,000 during day — triggers Medium Amount Review rule only',
    data: { user_id: DEMO_USER, amount: 12000, location: 'US', device_id: 'device-demo', transaction_time: '2026-04-12T10:00:00Z' },
  },
  {
    label:       'Safe Transaction (ALLOW)',
    description: '₹500 during day — no rules trigger',
    data: { user_id: DEMO_USER, amount: 500, location: 'IN', device_id: 'device-demo', transaction_time: '2026-04-12T09:00:00Z' },
  },
];

interface ScenarioSelectorProps {
  onSelect: (data: SimulateInput) => void;
}

export default function ScenarioSelector({ onSelect }: ScenarioSelectorProps) {
  return (
    <div>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
        Or pick a pre-built scenario:
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {scenarios.map(s => (
          <button
            key={s.label}
            title={s.description}
            onClick={() => onSelect(s.data)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '6px', fontSize: '0.8rem',
              border: '1px solid #e2e8f0', background: '#f8fafc',
              cursor: 'pointer', color: '#374151',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
