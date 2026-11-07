import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageContainer({ title, description, actions, children }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}
