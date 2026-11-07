import { KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { ColumnInfo } from '@/types';

export function SchemaTable({ columns }: { columns: ColumnInfo[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm" aria-label="Table schema">
        <thead>
          <tr className="border-b border-line bg-slate-50/70 text-left text-slate-600">
            <th scope="col" className="px-5 py-2.5 font-semibold">Column</th>
            <th scope="col" className="px-5 py-2.5 font-semibold">Type</th>
            <th scope="col" className="px-5 py-2.5 font-semibold">Key</th>
            <th scope="col" className="px-5 py-2.5 font-semibold">Constraint</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => (
            <tr key={column.column_name} className="border-b border-line/70 last:border-0">
              <td className="px-5 py-3 font-medium text-ink">{column.column_name}</td>
              <td className="px-5 py-3">
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                  {column.data_type || 'ANY'}
                </code>
              </td>
              <td className="px-5 py-3">
                {column.primary_key ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-700">
                    <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    Primary key
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-5 py-3">
                {column.not_null ? <Badge tone="info">Required</Badge> : <Badge>Nullable</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
