const integer = new Intl.NumberFormat();
const decimal = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatInteger = (value: number) => integer.format(value);
export const formatDecimal = (value: number) => decimal.format(value);

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatPercent(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}
