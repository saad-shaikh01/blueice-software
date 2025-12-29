'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { useGetDrivers } from '@/features/drivers/api/use-get-drivers';
import { Driver, columns } from '@/features/drivers/components/columns';
import { DriverTable } from '@/features/drivers/components/driver-list';

function DriversContent() {
  const { data, isLoading } = useGetDrivers();
  // @ts-ignore
  const drivers: Driver[] = (data?.drivers as Driver[]) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
        <Button asChild>
          <Link href="/drivers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Link>
        </Button>
      </div>
      <DriverTable columns={columns} data={drivers} isLoading={isLoading} />
    </div>
  );
}

export default function DriversPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DriversContent />
    </Suspense>
  );
}
