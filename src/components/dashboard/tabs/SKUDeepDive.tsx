import { useState } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KPICard } from '../KPICard';
import { cn } from '@/lib/utils';

import { WalmartListingRow } from '@/types/walmart';
import { getInventoryStatus } from '@/utils/status';
import { getRiskBucket } from '@/utils/risk';
import { daysBetween } from '@/utils/dates';

interface SKUDeepDiveProps {
  rows: WalmartListingRow[];
}

export function SKUDeepDive({ rows }: SKUDeepDiveProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<WalmartListingRow | null>(null);

  const handleSearch = () => {
    const q = searchQuery.toLowerCase();
    const found = rows.find(r =>
      r.UPC?.toLowerCase().includes(q) ||
      r.TRGID?.toLowerCase().includes(q) ||
      r.ItemID?.toLowerCase().includes(q) ||
      r.Title?.toLowerCase().includes(q)
    );
    if (found) setSelected(found);
  };

  const quickSelect = rows.slice(0, 5);

  if (!selected) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SKU Deep Dive</h1>
          <p className="text-muted-foreground">
            Search a TRG / UPC to view current-state listing details
          </p>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by UPC, TRGID, or Title…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Quick select:</span>
            {quickSelect.map((r, i) => (
              <Button
                key={r.TRGID || r.ItemID || r.UPC || i}
                size="sm"
                variant="outline"
                onClick={() => setSelected(r)}
                className="text-xs"
              >
                {r.TRGID || r.ItemID || r.UPC || `Item ${i + 1}`}
              </Button>
            ))}
          </div>
        </div>

        <div className="dashboard-card text-center py-16">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No SKU Selected</h3>
          <p className="text-muted-foreground">
            Search for a TRGID or UPC to begin
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     DERIVED VALUES
     ========================= */
  const status = getInventoryStatus(selected);
  const risk = getRiskBucket(selected);
  const daysInInventory = daysBetween(
    selected.CheckedInOn,
    new Date().toISOString()
  ) ?? 0;

  const daysToAvailable = selected.AvailableForSaleDate
    ? daysBetween(selected.CheckedInOn, selected.AvailableForSaleDate)
    : null;

  const timeline = [
    {
      label: 'Checked In',
      date: selected.CheckedInOn || null,
      complete: !!selected.CheckedInOn,
    },
    {
      label: 'Ops Complete',
      date: selected.OpsCompletedOn || null,
      complete: !!selected.OpsComplete,
    },
    {
      label: 'Available for Sale',
      date: selected.AvailableForSaleDate || null,
      complete: !!selected.AvailableForSale,
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SKU Deep Dive</h1>
        <p className="text-muted-foreground">
          Current-state listing dossier for a single TRG
        </p>
      </div>

      {/* Item Header */}
      <div className="dashboard-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={cn(
                'risk-badge',
                risk === 'Low' && 'risk-low',
                risk === 'Medium' && 'risk-medium',
                risk === 'High' && 'risk-high',
                risk === 'Critical' && 'risk-critical'
              )}>
                {risk} Risk
              </span>
              <span className={cn(
                'status-badge',
                status === 'Live' && 'status-live',
                status === 'Processing' && 'status-pending',
                status === 'Ops Complete' && 'status-unlisted',
                status === 'Blocked' && 'status-suppressed'
              )}>
                {status}
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1">{selected.Title || 'Untitled Item'}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {selected.TRGID && <span className="font-mono">TRG: {selected.TRGID}</span>}
              {selected.ItemID && <span className="font-mono">Item ID: {selected.ItemID}</span>}
              {selected.UPC && <span>UPC: {selected.UPC}</span>}
              {selected.CategoryName && <span>Category: {selected.CategoryName}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard value={daysInInventory} label="Days in Inventory" />
        <KPICard
          value={daysToAvailable ?? '—'}
          label="Days to Available"
        />
        <KPICard
          value={selected.AvailableForSale ? 'Yes' : 'No'}
          label="Available for Sale"
        />
        <KPICard
          value={selected.LocationNotListable ? 'Yes' : 'No'}
          label="Blocked"
        />
      </div>

      {/* Timeline */}
      <div className="dashboard-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Inventory Timeline
        </h3>
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
          <div className="flex justify-between relative">
            {timeline.map(t => (
              <div key={t.label} className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center z-10',
                  t.complete ? 'bg-status-live' : 'bg-muted'
                )}>
                  {t.complete ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.date || 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk & Actions */}
      <div className="dashboard-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Risk & Action Notes
        </h3>
        <div className="space-y-3">
          {risk !== 'Low' && (
            <Notice
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Elevated Risk"
              body={`This item is classified as ${risk} risk based on aging and status.`}
              tone="warning"
            />
          )}
          {selected.LocationNotListable && (
            <Notice
              icon={<AlertTriangle className="w-5 h-5" />}
              title="Blocked from Listing"
              body="Item is not listable. Resolve compliance or content blockers."
              tone="critical"
            />
          )}
          {selected.OpsComplete && !selected.AvailableForSale && (
            <Notice
              icon={<Clock className="w-5 h-5" />}
              title="Ops Complete, Not Live"
              body="Item is ready operationally but not yet available for sale."
              tone="warning"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: 'warning' | 'critical';
}) {
  const tones = {
    warning: 'bg-status-pending/10 border-status-pending/20 text-status-pending',
    critical: 'bg-status-suppressed/10 border-status-suppressed/20 text-status-suppressed',
  };

  return (
    <div className={cn('p-3 rounded-lg border flex gap-3', tones[tone])}>
      {icon}
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs opacity-80">{body}</div>
      </div>
    </div>
  );
}
