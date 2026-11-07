// Shapes returned by the bridge API. Each one mirrors the output of an MCP tool.
// `type` aliases (not interfaces) so they are assignable to Row.

export type Row = Record<string, unknown>;

export type Health = {
  bridge: string;
  mcp_connected: boolean;
  mcp_error: string | null;
  server_name: string;
  database_type: string;
  tools: string[];
};

export type ToolInfo = { name: string; description: string };

export type CustomerSummary = {
  total_customers: number;
  total_orders: number;
  average_orders: number;
  highest_orders: number;
};

export type CityOrders = {
  city: string;
  total_customers: number;
  total_orders: number;
};

export type Customer = {
  id: number;
  name: string | null;
  city: string | null;
  total_orders: number | null;
};

export type QualitySummary = {
  total_records: number;
  missing_names: number;
  missing_cities: number;
  missing_order_counts: number;
  negative_order_counts: number;
};

export type DuplicateGroup = {
  name: string;
  city: string | null;
  duplicate_count: number;
};

export type QualityReport = {
  summary: QualitySummary;
  duplicates: DuplicateGroup[];
};

export type ColumnInfo = {
  column_name: string;
  data_type: string;
  not_null: boolean;
  primary_key: boolean;
};

export type TableSchema = { columns: ColumnInfo[]; row_count: number | null };
export type TableRows = { rows: Row[]; truncated: boolean; limit: number };

export type QueryResult = {
  columns: string[];
  rows: Row[];
  row_count: number;
  truncated: boolean;
  row_limit: number;
  duration_ms: number;
};

export type HistoryEntry = {
  id: string;
  query: string;
  ranAt: string;
  status: 'success' | 'error';
  rowCount?: number;
};
