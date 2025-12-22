'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetDrivers } from '@/features/drivers/api/use-get-drivers';
import { useBulkAssignOrders } from '@/features/orders/api/use-bulk-assign-orders';
import { Driver } from '@/features/drivers/components/columns';

interface AssignDriverModalProps {
  orderIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AssignDriverModal = ({ orderIds, open, onOpenChange, onSuccess }: AssignDriverModalProps) => {
  const [driverId, setDriverId] = useState<string>('');
  const { data: driversData, isLoading: isLoadingDrivers } = useGetDrivers();
  const { mutate: assignOrders, isPending } = useBulkAssignOrders();

  // @ts-ignore
  const drivers = (driversData?.drivers as Driver[]) || [];

  const handleSubmit = () => {
    if (!driverId) return;

    assignOrders({
      orderIds,
      driverId,
    }, {
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setDriverId('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <DialogDescription>
            Assign {orderIds.length} orders to a driver.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={driverId} onValueChange={setDriverId} disabled={isPending || isLoadingDrivers}>
            <SelectTrigger>
              <SelectValue placeholder="Select a driver" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.user.name} ({driver.vehicleNo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !driverId}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
