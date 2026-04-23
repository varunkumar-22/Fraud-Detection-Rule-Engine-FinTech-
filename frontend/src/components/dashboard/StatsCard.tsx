interface StatsCardProps {
  label:  string;
  value:  string | number;
  color?: string;
}

export default function StatsCard({ label, value, color = '#3b82f6' }: StatsCardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: '8px', padding: '1.5rem',
      border: '1px solid #e2e8f0', borderTop: `4px solid ${color}`,
      minWidth: '160px', flex: 1,
    }}>
      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginTop: '0.5rem' }}>
        {value}
      </div>
    </div>
  );
}
