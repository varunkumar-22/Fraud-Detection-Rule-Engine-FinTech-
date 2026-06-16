import type { Decision } from '../../types';

interface BadgeProps {
  decision: Decision;
}

const styles: Record<Decision, React.CSSProperties> = {
  ALLOW:  { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
  REVIEW: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  BLOCK:  { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
};

const icons: Record<Decision, string> = {
  ALLOW:  '✓',
  REVIEW: '⚠',
  BLOCK:  '✕',
};

export default function Badge({ decision }: BadgeProps) {
  return (
    <span style={{
      ...styles[decision],
      padding: '2px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
    }}>
      {icons[decision]} {decision}
    </span>
  );
}
