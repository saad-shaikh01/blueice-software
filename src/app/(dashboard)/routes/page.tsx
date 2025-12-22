'use client';

import { Suspense } from 'react';
import { useGetRoutes } from '@/features/routes/api/use-get-routes';
import { RouteTable } from '@/features/routes/components/route-list';
import { columns, Route } from '@/features/routes/components/columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

function RoutesContent() {
  const { data, isLoading } = useGetRoutes();
  // @ts-ignore
  const routes: Route[] = (data?.routes as Route[]) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Routes</h1>
        <Button asChild>
           <Link href="/routes/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Route
          </Link>
        </Button>
      </div>
      <RouteTable columns={columns} data={routes} isLoading={isLoading} />
    </div>
  );
}

export default function RoutesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RoutesContent />
        </Suspense>
    )
}
