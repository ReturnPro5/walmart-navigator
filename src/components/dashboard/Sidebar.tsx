import { useState } from 'react';
import {
  LayoutDashboard,
  GitBranch,
  HeartPulse,
  Clock,
  TrendingUp,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'executive', label: 'Executive Snapshot', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'funnel', label: 'Inventory Funnel', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'health', label: 'Listing Health', icon: <HeartPulse className="w-5 h-5" /> },
  { id: 'aging', label: 'Aging & Risk', icon: <Clock className="w-5 h-5" /> },
  { id: 'performance', label: 'Sales Performance', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'sku', label: 'SKU Deep Dive', icon: <Search className="w-5 h-5" /> },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">W</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sidebar-foreground font-semibold text-sm">
              Walmart US
            </span>
            <span className="text-sidebar-foreground/60 text-xs">
              Operations Dashboard
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'nav-link w-full',
                activeTab === item.id ? 'nav-link-active' : 'nav-link-inactive'
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom Actions (NO UPLOAD) */}
      <div className="px-2 py-4 border-t border-sidebar-border">
        <button className="nav-link nav-link-inactive w-full">
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
