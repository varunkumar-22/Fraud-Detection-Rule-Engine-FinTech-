import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',         label: 'Dashboard',  icon: '▤' },
  { to: '/rules',    label: 'Rules',      icon: '⚙' },
  { to: '/simulate', label: 'Simulate',   icon: '▶' },
  { to: '/results',  label: 'Results',    icon: '📋' },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '220px', minHeight: '100vh', background: '#1e293b',
      color: '#cbd5e1', display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
    }}>
      <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid #334155' }}>
        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Fraud Detection
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginTop: '4px' }}>
          Rule Engine
        </div>
      </div>
      <nav style={{ marginTop: '1rem', flex: 1 }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 1.5rem', textDecoration: 'none',
            color: isActive ? '#f1f5f9' : '#94a3b8',
            background: isActive ? '#334155' : 'transparent',
            borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
            fontSize: '0.9rem', fontWeight: isActive ? 600 : 400,
          })}>
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
