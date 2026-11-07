import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Row } from '@/types';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface DataTableProps {
  rows: Row[];
  /** Column order. Defaults to the keys of the first row. */
  columns?: string[];
  pageSize?: number;
  searchable?: boolean;
  /** Accessible name for the table. */
  label: string;
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="italic text-slate-400">NULL</span>;
  if (typeof value === 'object') return <>{JSON.stringify(value)}</>;
  return <>{String(value)}</>;
}

export function DataTable({ rows, columns, pageSize = 10, searchable = true, label }: DataTableProps) {
  const keys = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    return rows.length > 0 ? Object.keys(rows[0]) : [];
  }, [columns, rows]);

  const numeric = useMemo(
    () => new Set(keys.filter((key) => rows.some((row) => typeof row[key] === 'number'))),
    [keys, rows],
  );

  const definitions = useMemo<ColumnDef<Row>[]>(
    () =>
      keys.map((key) => ({
        id: key,
        accessorFn: (row) => row[key],
        header: key,
        cell: (context) => <CellValue value={context.getValue()} />,
      })),
    [keys],
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');

  const table = useReactTable({
    data: rows,
    columns: definitions,
    state: { sorting, globalFilter: filter },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: size } = table.getState().pagination;
  const from = filteredCount === 0 ? 0 : pageIndex * size + 1;
  const to = Math.min(filteredCount, (pageIndex + 1) * size);
  const showSearch = searchable && rows.length > 1;

  return (
    <div>
      {showSearch && (
        <div className="border-b border-line px-4 py-3">
          <label className="relative block max-w-xs">
            <span className="sr-only">Filter rows in {label}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter rows"
              className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm placeholder:text-slate-400"
            />
          </label>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm" aria-label={label}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-line bg-slate-50/70">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                      className={cn('px-4 py-2.5 font-semibold text-slate-600', numeric.has(header.id) ? 'text-right' : 'text-left')}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded hover:text-ink',
                          numeric.has(header.id) && 'flex-row-reverse',
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <Icon className={cn('h-3.5 w-3.5', sorted ? 'text-indigo-600' : 'text-slate-300')} aria-hidden />
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line/70 last:border-0 hover:bg-slate-50/60">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn('px-4 py-2.5 text-slate-800', numeric.has(cell.column.id) && 'text-right tabular-nums')}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCount === 0 && rows.length > 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No rows match “{filter}”.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-sm text-slate-600">
        <p aria-live="polite">
          {filteredCount === 0 ? '0 rows' : `${from}–${to} of ${filteredCount} ${filteredCount === 1 ? 'row' : 'rows'}`}
        </p>
        {table.getPageCount() > 1 && (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span className="px-1 tabular-nums">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button size="sm" variant="ghost" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
