interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid #e2e8f0',
      padding: '1rem 2rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
        {title}
      </h1>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
        Fraud Detection Rule Engine
      </span>
    </header>
  );
}
