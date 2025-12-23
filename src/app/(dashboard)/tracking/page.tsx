import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Live Tracking | Blue Ice CRM',
  description: 'Real-time driver location tracking and monitoring',
};

// Dynamically import the map component to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import('@/features/tracking/components/live-map').then((mod) => mod.LiveMap), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] rounded-lg border bg-muted/20">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

export default function TrackingPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-muted-foreground">Monitor driver locations and status in real-time</p>
      </div>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Locations</CardTitle>
          <CardDescription>Live map showing all active drivers (updates every 10 seconds)</CardDescription>
        </CardHeader>
        <CardContent>
          <LiveMap height="calc(100vh - 280px)" />
        </CardContent>
      </Card>
    </div>
  );
}
