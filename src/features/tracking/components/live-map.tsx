'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

interface LiveMapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const LiveMapCore = dynamic(() => import('./live-map-core'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted/20">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

export function LiveMap(props: LiveMapProps) {
  return <LiveMapCore {...props} />;
}
