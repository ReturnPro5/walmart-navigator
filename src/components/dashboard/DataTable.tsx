import { useState } from 'react';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WalmartListingRow } from '@/types/walmart';
import { getInventoryStatus } from '@/utils/status';
import { getRiskBucket } from '@/utils/risk';

interface DataTableProps {
  data: WalmartListingRow[];
  title?: string;
  onRowClick?: (item: WalmartListingRow) => void;
}

type SortField = 'UPC' | 'Title' | 'CategoryName' | 'Condition' | 'FacilityName' | 'QuantityOnHand' | 'AgingDays' | 'status' | 'risk';

export function DataTable({ data, title, onRowClick }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>('AgingDays');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortValue = (row: WalmartListingRow, field: SortField): string | number => {
    switch (field) {
      case 'status':
        return getInventoryStatus(row);
      case 'risk':
        return getRiskBucket(row);
      case 'UPC':
        return row.UPC || '';
      case 'Title':
        return row.Title || '';
      case 'CategoryName':
        return row.CategoryName || '';
      case 'Condition':
        return row.Condition || '';
      case 'FacilityName':
        return row.FacilityName || '';
      case 'QuantityOnHand':
        return row.QuantityOnHand || 0;
      case 'AgingDays':
        return row.AgingDays || 0;
      default:
        return '';
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Low': return 'risk-low';
      case 'Medium': return 'risk-medium';
      case 'High': return 'risk-high';
      case 'Critical': return 'risk-critical';
      default: return '';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Live': return 'status-live';
      case 'Ops Complete': return 'status-unlisted';
      case 'Blocked': return 'status-suppressed';
      case 'Processing': return 'status-pending';
      default: return '';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const columns: { key: SortField; label: string; sortable?: boolean }[] = [
    { key: 'UPC', label: 'UPC', sortable: true },
    { key: 'Title', label: 'Title', sortable: true },
    { key: 'CategoryName', label: 'Category', sortable: true },
    { key: 'Condition', label: 'Condition', sortable: true },
    { key: 'FacilityName', label: 'Facility', sortable: true },
    { key: 'QuantityOnHand', label: 'Qty', sortable: true },
    { key: 'AgingDays', label: 'Aging', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'risk', label: 'Risk', sortable: true },
  ];

  return (
    <div className="dashboard-card overflow-hidden">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">{data.length} items</span>
        </div>
      )}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap",
                    col.sortable && "cursor-pointer hover:bg-muted/70 transition-colors"
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => {
              const status = getInventoryStatus(item);
              const risk = getRiskBucket(item);
              return (
                <tr 
                  key={item.id || item.TRGID || item.UPC || index}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(item)}
                >
                  <td className="font-mono text-xs">{item.UPC || '—'}</td>
                  <td className="max-w-[200px] truncate" title={item.Title}>{item.Title || '—'}</td>
                  <td>{item.CategoryName || '—'}</td>
                  <td>{item.Condition || '—'}</td>
                  <td>{item.FacilityName || '—'}</td>
                  <td className="text-right">{item.QuantityOnHand ?? '—'}</td>
                  <td className="text-right">{item.AgingDays != null ? `${item.AgingDays}d` : '—'}</td>
                  <td>
                    <span className={cn("status-badge", getStatusBadgeClass(status))}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <span className={cn("risk-badge", getRiskBadgeClass(risk))}>
                      {risk}
                    </span>
                  </td>
                  <td>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
