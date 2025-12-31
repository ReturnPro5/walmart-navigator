import { useState } from 'react';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InventoryItem } from '@/lib/mockData';

interface DataTableProps {
  data: InventoryItem[];
  title?: string;
  onRowClick?: (item: InventoryItem) => void;
}

export function DataTable({ data, title, onRowClick }: DataTableProps) {
  const [sortField, setSortField] = useState<keyof InventoryItem>('agingDays');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
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
      case 'Published': return 'status-live';
      case 'Unpublished': return 'status-unlisted';
      case 'Suppressed': return 'status-suppressed';
      case 'Out of Stock': return 'status-pending';
      default: return '';
    }
  };

  const SortIcon = ({ field }: { field: keyof InventoryItem }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const columns: { key: keyof InventoryItem; label: string; sortable?: boolean }[] = [
    { key: 'upc', label: 'UPC', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'condition', label: 'Condition', sortable: true },
    { key: 'facility', label: 'Facility', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true },
    { key: 'agingDays', label: 'Aging', sortable: true },
    { key: 'listingStatus', label: 'Status', sortable: true },
    { key: 'riskLevel', label: 'Risk', sortable: true },
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
            {sortedData.map((item) => (
              <tr 
                key={item.id}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(item)}
              >
                <td className="font-mono text-xs">{item.upc}</td>
                <td className="max-w-[200px] truncate" title={item.title}>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.condition}</td>
                <td>{item.facility}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{item.agingDays}d</td>
                <td>
                  <span className={cn("status-badge", getStatusBadgeClass(item.listingStatus))}>
                    {item.listingStatus}
                  </span>
                </td>
                <td>
                  <span className={cn("risk-badge", getRiskBadgeClass(item.riskLevel))}>
                    {item.riskLevel}
                  </span>
                </td>
                <td>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
