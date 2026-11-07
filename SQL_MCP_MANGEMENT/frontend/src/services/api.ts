import type {
  CityOrders,
  Customer,
  CustomerSummary,
  Health,
  QualityReport,
  QueryResult,
  TableRows,
  TableSchema,
  ToolInfo,
} from '@/types';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError(
      'Cannot reach the bridge API. Start it with "uvicorn main:app --port 8000" in the bridge folder.',
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'detail' in body) {
        const detail = (body as { detail: unknown }).detail;
        message = typeof detail === 'string' ? detail : 'The request was not valid.';
      }
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export const api = {
  health: () => request<Health>('/api/health'),
  tools: () => request<ToolInfo[]>('/api/tools'),
  reconnect: () => request<{ mcp_connected: boolean; tools: string[] }>('/api/reconnect', { method: 'POST' }),
  summary: () => request<CustomerSummary>('/api/summary'),
  cities: () => request<CityOrders[]>('/api/cities'),
  topCustomers: (limit: number) => request<Customer[]>(`/api/top-customers?limit=${limit}`),
  customers: () => request<Customer[]>('/api/customers'),
  quality: () => request<QualityReport>('/api/quality'),
  tables: () => request<string[]>('/api/tables'),
  tableSchema: (name: string) => request<TableSchema>(`/api/tables/${encodeURIComponent(name)}/schema`),
  tableRows: (name: string, limit = 100) =>
    request<TableRows>(`/api/tables/${encodeURIComponent(name)}/rows?limit=${limit}`),
  runQuery: (query: string) =>
    request<QueryResult>('/api/query', { method: 'POST', body: JSON.stringify({ query }) }),
};
