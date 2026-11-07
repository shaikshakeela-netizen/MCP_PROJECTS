import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navGroups } from '@/navigation';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1D2950" />
      <g fill="none" stroke="#9DABFF" strokeWidth="1.8" strokeLinecap="round">
        <ellipse cx="16" cy="10" rx="7" ry="3" />
        <path d="M9 10v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        <path d="M9 16v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </g>
    </svg>
  );
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-navy-950/60 lg:hidden" onClick={onCloseMobile} aria-hidden />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-slate-300 transition-transform duration-200',
          'lg:static lg:translate-x-0 lg:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        )}
        aria-label="Sidebar"
      >
        <div className={cn('flex items-center gap-3 px-4 pb-4 pt-5', collapsed && 'lg:justify-center lg:px-0')}>
          <LogoMark />
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="text-[15px] font-semibold leading-tight text-white">SQL MCP Studio</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">Intelligent Database Analytics &amp; Management</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2" aria-label="Main">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className={cn('mb-1.5 px-3 text-xs font-medium text-slate-500', collapsed && 'lg:sr-only')}>{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                          collapsed && 'lg:justify-center lg:px-0',
                          isActive ? 'bg-navy-700 text-white' : 'text-slate-400 hover:bg-navy-800 hover:text-slate-100',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="nav-indicator"
                              className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-indigo-400"
                              aria-hidden
                            />
                          )}
                          <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                          <span className={cn(collapsed && 'lg:sr-only')}>{item.label}</span>
                          {collapsed && (
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-navy-950 px-2.5 py-1.5 text-xs text-white shadow-pop lg:group-hover:block lg:group-focus-visible:block"
                            >
                              {item.label}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-navy-700 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-slate-400 hover:bg-navy-800 hover:text-white',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden /> : <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
