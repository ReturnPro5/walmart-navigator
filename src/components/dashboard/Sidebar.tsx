import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  HeartPulse, 
  Clock, 
  TrendingUp, 
  Search,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'executive', label: 'Executive Snapshot', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'funnel', label: 'Inventory Funnel', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'health', label: 'Listing Health', icon: <HeartPulse className="w-5 h-5" /> },
  { id: 'aging', label: 'Aging & Risk', icon: <Clock className="w-5 h-5" /> },
  { id: 'performance', label: 'Sales Performance', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'sku', label: 'SKU Deep Dive', icon: <Search className="w-5 h-5" /> },
  { id: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, adminOnly: true },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = navItems.filter(item => !item.adminOnly || user?.isAdmin);

  function handleTabClick(id: string) {
    if (id === 'admin') {
      navigate('/admin');
    } else {
      onTabChange(id);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-sm">W</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sidebar-foreground font-semibold text-sm">Walmart US</span>
            <span className="text-sidebar-foreground/60 text-xs">Operations Dashboard</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={cn(
                "nav-link w-full",
                activeTab === item.id ? "nav-link-active" : "nav-link-inactive"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom — user info + logout */}
      <div className="px-2 py-4 border-t border-sidebar-border space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <div className="text-xs text-sidebar-foreground/60 truncate">{user.email}</div>
            <div className="text-xs text-sidebar-foreground/40 capitalize">{user.role.replace('_', ' ')}</div>
          </div>
        )}
        <button onClick={handleLogout} className="nav-link nav-link-inactive w-full">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
