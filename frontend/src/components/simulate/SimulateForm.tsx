import { useState, useEffect } from 'react';
import type { SimulateInput } from '../../types';

interface SimulateFormProps {
  initial?:   Partial<SimulateInput>;
  onSubmit:   (data: SimulateInput) => Promise<void>;
  loading:    boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px',
  border: '1px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box',
};

const blank: SimulateInput = {
  user_id: 'a1b2c3d4-0001-0001-0001-000000000001',
  amount: 0, location: '', device_id: 'device-web',
};

export default function SimulateForm({ initial, onSubmit, loading }: SimulateFormProps) {
  const [form, setForm] = useState<SimulateInput>({ ...blank, ...initial });

  useEffect(() => {
    if (initial) setForm(f => ({ ...f, ...initial }));
  }, [initial]);

  const set = (k: keyof SimulateInput, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...form, amount: Number(form.amount) });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          User ID *
          <input style={inputStyle} value={form.user_id} onChange={e => set('user_id', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Amount (₹) *
          <input style={inputStyle} type="number" min={1} value={form.amount || ''} onChange={e => set('amount', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Location *
          <input style={inputStyle} placeholder="e.g. IN, US, UK" value={form.location} onChange={e => set('location', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151' }}>
          Device ID *
          <input style={inputStyle} placeholder="e.g. device-mobile" value={form.device_id} onChange={e => set('device_id', e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#374151', gridColumn: '1 / -1' }}>
          Transaction Time (optional — defaults to now)
          <input style={inputStyle} type="datetime-local" value={form.transaction_time?.slice(0, 16) ?? ''} onChange={e => set('transaction_time', e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
        </label>
      </div>
      <button type="submit" disabled={loading} style={{
        padding: '0.65rem', borderRadius: '6px', border: 'none',
        background: '#3b82f6', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.9rem', fontWeight: 600, opacity: loading ? 0.7 : 1,
      }}>
        {loading ? 'Checking…' : 'Verify Payment'}
      </button>
    </form>
  );
}
