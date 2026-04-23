import type {
  FraudRule, SimulationResult, EvaluationSummary,
  SimulateInput, CreateRuleInput,
} from '../types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? json.errors?.[0]?.message ?? 'Request failed');
  return json.data as T;
}

// Rules
export const getRules = () =>
  request<FraudRule[]>('/rules');

export const createRule = (data: CreateRuleInput) =>
  request<FraudRule>('/rules', { method: 'POST', body: JSON.stringify(data) });

export const toggleRule = (ruleId: string, is_active: boolean) =>
  request<FraudRule>(`/rules/${ruleId}`, { method: 'PATCH', body: JSON.stringify({ is_active }) });

export const deleteRule = (ruleId: string) =>
  request<void>(`/rules/${ruleId}`, { method: 'DELETE' });

// Simulate
export const simulate = (data: SimulateInput) =>
  request<SimulationResult>('/simulate', { method: 'POST', body: JSON.stringify(data) });

// Results
export const getResults = (params?: { limit?: number; offset?: number; decision?: string }) => {
  const qs = new URLSearchParams();
  if (params?.limit)    qs.set('limit',    String(params.limit));
  if (params?.offset)   qs.set('offset',   String(params.offset));
  if (params?.decision) qs.set('decision', params.decision);
  const query = qs.toString() ? `?${qs}` : '';
  return fetch(`${BASE}/results${query}`, { headers: { 'Content-Type': 'application/json' } })
    .then(r => r.json())
    .then(j => ({ results: j.data as EvaluationSummary[], total: j.meta?.total ?? 0 }));
};
