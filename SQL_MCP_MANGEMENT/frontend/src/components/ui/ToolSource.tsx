import { Plug } from 'lucide-react';

/** Shows which MCP tool produced the data above it. */
export function ToolSource({ tool }: { tool: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-500" title="Data returned by this MCP tool">
      <Plug className="h-3 w-3" aria-hidden />
      <span className="sr-only">Source MCP tool:</span>
      <code className="font-mono text-[11px]">{tool}</code>
    </p>
  );
}
