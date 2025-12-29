'use client';

import { ChevronDown, ChevronRight, Maximize2, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { DriverListItem } from './driver-list-item';

interface DriverLocation {
  driverId: string;
  name: string;
  phoneNumber: string;
  imageUrl: string | null;
  vehicleNo: string | null;
  latitude: number;
  longitude: number;
  lastUpdate: string | null;
  isOnDuty: boolean;
  isMoving?: boolean;
  batteryLevel?: number;
  currentOrder: unknown;
}

interface DriverSidebarProps {
  drivers: DriverLocation[];
  selectedDriverId: string | null;
  onDriverSelect: (driver: DriverLocation) => void;
  onFitAllDrivers: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type FilterType = 'all' | 'on-duty' | 'off-duty' | 'moving' | 'idle';

export function DriverSidebar({
  drivers,
  selectedDriverId,
  onDriverSelect,
  onFitAllDrivers,
  isCollapsed = false,
  onToggleCollapse,
}: DriverSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showOffDuty, setShowOffDuty] = useState(false);

  // Filter and search drivers
  const filteredDrivers = useMemo(() => {
    let result = [...drivers];

    // Apply filter
    switch (filter) {
      case 'on-duty':
        result = result.filter((d) => d.isOnDuty);
        break;
      case 'off-duty':
        result = result.filter((d) => !d.isOnDuty);
        break;
      case 'moving':
        result = result.filter((d) => d.isOnDuty && d.isMoving);
        break;
      case 'idle':
        result = result.filter((d) => d.isOnDuty && !d.isMoving);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(query) || d.phoneNumber.includes(query) || d.vehicleNo?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [drivers, filter, searchQuery]);

  // Separate on-duty and off-duty drivers
  const onDutyDrivers = filteredDrivers.filter((d) => d.isOnDuty);
  const offDutyDrivers = filteredDrivers.filter((d) => !d.isOnDuty);

  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center gap-2 border-r bg-card p-2">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Expand sidebar">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-80 flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Drivers</h2>
            <p className="text-xs text-muted-foreground">
              {drivers.length} total • {onDutyDrivers.length} on duty
            </p>
          </div>
          {onToggleCollapse && (
            <Button variant="ghost" size="icon" onClick={onToggleCollapse} title="Collapse sidebar">
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
          )}
        </div>

        {/* Fit All Button */}
        <Button onClick={onFitAllDrivers} variant="outline" size="sm" className="mb-3 w-full">
          <Maximize2 className="mr-2 h-4 w-4" />
          Fit All Drivers
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter */}
        <div className="mt-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              <SelectItem value="on-duty">On Duty Only</SelectItem>
              <SelectItem value="off-duty">Off Duty Only</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Driver List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* On Duty Drivers */}
          {onDutyDrivers.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">On Duty ({onDutyDrivers.length})</h3>
              <div className="space-y-2">
                {onDutyDrivers.map((driver) => (
                  <DriverListItem
                    key={driver.driverId}
                    driver={driver}
                    isSelected={selectedDriverId === driver.driverId}
                    onClick={() => onDriverSelect(driver)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Off Duty Drivers */}
          {offDutyDrivers.length > 0 && (
            <div>
              <button
                onClick={() => setShowOffDuty(!showOffDuty)}
                className="mb-2 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                <span>Off Duty ({offDutyDrivers.length})</span>
                {showOffDuty ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>

              {showOffDuty && (
                <div className="space-y-2">
                  {offDutyDrivers.map((driver) => (
                    <DriverListItem
                      key={driver.driverId}
                      driver={driver}
                      isSelected={selectedDriverId === driver.driverId}
                      onClick={() => onDriverSelect(driver)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {filteredDrivers.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No drivers found matching your search' : 'No drivers available'}
              </p>
              {searchQuery && (
                <Button variant="link" size="sm" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear search
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
