'use client';

import { AlertCircle, CheckCircle2, CloudOff, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getPendingDeliveriesCount, getStorageStats } from '@/lib/offline-storage';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    cachedOrders: 0,
    pendingDeliveries: 0,
    pendingLocations: 0,
    pendingPhotos: 0,
  });

  // Update pending count
  useEffect(() => {
    const updateStats = async () => {
      try {
        const [count, storageStats] = await Promise.all([getPendingDeliveriesCount(), getStorageStats()]);
        setPendingCount(count);
        setStats(storageStats);
      } catch (error) {
        console.error('Failed to get offline stats:', error);
      }
    };

    updateStats();

    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Force sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline]);

  const handleSync = async () => {
    if (!isOnline) return;

    setIsLoading(true);

    try {
      // Trigger service worker sync
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-deliveries');
        await registration.sync.register('sync-location');
      }

      // Wait a bit for sync to complete
      setTimeout(async () => {
        const newCount = await getPendingDeliveriesCount();
        setPendingCount(newCount);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setIsLoading(false);
    }
  };

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96 print:hidden">
      {!isOnline ? (
        // Offline Alert
        <Alert variant="destructive" className="border-2 shadow-lg">
          <WifiOff className="h-5 w-5" />
          <AlertTitle className="flex items-center justify-between">
            <span className="font-bold">Offline Mode</span>
            {stats.cachedOrders > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.cachedOrders} orders cached
              </Badge>
            )}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm">You're working offline. Changes will sync when online.</p>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">{pendingCount} delivery(s) pending sync</span>
              </div>
            )}
            {stats.pendingPhotos > 0 && <p className="text-xs text-muted-foreground">+ {stats.pendingPhotos} photo(s) waiting to upload</p>}
          </AlertDescription>
        </Alert>
      ) : pendingCount > 0 ? (
        // Syncing Alert
        <Alert className="border-2 border-blue-500 bg-blue-50 shadow-lg dark:bg-blue-950">
          <RefreshCw className={`h-5 w-5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
          <AlertTitle className="flex items-center justify-between text-blue-900 dark:text-blue-100">
            <span className="font-bold">Syncing Changes</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-900">
              {pendingCount} pending
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {isLoading ? 'Uploading offline changes...' : 'Changes from offline work are being synced'}
            </p>
            {!isLoading && (
              <Button size="sm" variant="outline" onClick={handleSync} className="mt-2 h-8 border-blue-300 text-blue-700 hover:bg-blue-100">
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry Sync
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
