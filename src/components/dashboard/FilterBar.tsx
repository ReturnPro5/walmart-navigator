import { useState } from 'react';
import { Filter, Calendar, Building2, Tag, Package, ListFilter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { fiscalWeeks, facilities, categories, conditions, programs } from '@/lib/mockData';

export interface FilterState {
  fiscalWeeks: string[];
  facility: string;
  category: string;
  condition: string;
  program: string;
  listingStatus: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(filters.fiscalWeeks);

  const handleWeekToggle = (week: string) => {
    const newWeeks = selectedWeeks.includes(week)
      ? selectedWeeks.filter(w => w !== week)
      : [...selectedWeeks, week];
    setSelectedWeeks(newWeeks);
    onFilterChange({ ...filters, fiscalWeeks: newWeeks });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      fiscalWeeks: [],
      facility: '',
      category: '',
      condition: '',
      program: '',
      listingStatus: '',
    };
    setSelectedWeeks([]);
    onFilterChange(cleared);
  };

  const activeFiltersCount = [
    selectedWeeks.length > 0,
    filters.facility,
    filters.category,
    filters.condition,
    filters.program,
    filters.listingStatus,
  ].filter(Boolean).length;

  return (
    <div className="filter-bar">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount} active
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-1">
        {/* Fiscal Week Selector */}
        <Select onValueChange={(value) => handleWeekToggle(value)}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Fiscal Week" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {fiscalWeeks.slice(40, 52).map((week) => (
              <SelectItem key={week} value={week}>
                <span className="flex items-center gap-2">
                  {selectedWeeks.includes(week) && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                  {week}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected Weeks */}
        {selectedWeeks.length > 0 && (
          <div className="flex items-center gap-1">
            {selectedWeeks.slice(0, 3).map((week) => (
              <Badge key={week} variant="outline" className="text-xs gap-1">
                {week}
                <button onClick={() => handleWeekToggle(week)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {selectedWeeks.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{selectedWeeks.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Facility */}
        <Select value={filters.facility} onValueChange={(v) => handleFilterChange('facility', v)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Facility" />
          </SelectTrigger>
          <SelectContent>
            {facilities.map((facility) => (
              <SelectItem key={facility} value={facility}>{facility}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category */}
        <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Condition */}
        <Select value={filters.condition} onValueChange={(v) => handleFilterChange('condition', v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <Package className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((condition) => (
              <SelectItem key={condition} value={condition}>{condition}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Program */}
        <Select value={filters.program} onValueChange={(v) => handleFilterChange('program', v)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <ListFilter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            {programs.map((program) => (
              <SelectItem key={program} value={program}>{program}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Listing Status */}
        <Select value={filters.listingStatus} onValueChange={(v) => handleFilterChange('listingStatus', v)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Listing Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Unpublished">Unpublished</SelectItem>
            <SelectItem value="Suppressed">Suppressed</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
          Clear all
        </Button>
      )}
    </div>
  );
}
