import { Metadata } from 'next';

import { LiveMap } from '@/features/tracking/components/live-map';

export const metadata: Metadata = {
  title: 'Live Tracking | Blue Ice CRM',
  description: 'Real-time driver location tracking and monitoring',
};

export default function TrackingPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
          <p className="text-muted-foreground">Mission Control - Monitor all drivers in real-time</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-2 text-sm">
          <span className="text-muted-foreground">Updates every</span>
          <span className="ml-1 font-semibold">10 seconds</span>
        </div>
      </div>

      {/* Map with Sidebar - Full height */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-card">
        <LiveMap height="100%" showSidebar={true} />
      </div>
    </div>
  );
}
