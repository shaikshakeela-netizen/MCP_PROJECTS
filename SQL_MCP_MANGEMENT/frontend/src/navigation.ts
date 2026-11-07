import {
  Database,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  TerminalSquare,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };
export type NavGroup = { title: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    title: 'Analyze',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/customers', label: 'Customer Analytics', icon: Users },
      { to: '/quality', label: 'Data Quality', icon: ShieldCheck },
    ],
  },
  {
    title: 'Database',
    items: [
      { to: '/explorer', label: 'Database Explorer', icon: Database },
      { to: '/playground', label: 'SQL Playground', icon: TerminalSquare },
      { to: '/history', label: 'Query History', icon: History },
    ],
  },
  {
    title: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

export function pageTitle(pathname: string): string {
  const items = navGroups.flatMap((group) => group.items);
  const match = items.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  return match?.label ?? 'Dashboard';
}
