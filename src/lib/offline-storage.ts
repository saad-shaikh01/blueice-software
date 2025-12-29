import { DBSchema, IDBPDatabase, openDB } from 'idb';

// Database schema definition
interface DriverDB extends DBSchema {
  'todays-orders': {
    key: string;
    value: any; // Order object
    indexes: { 'by-status': string };
  };
  'pending-deliveries': {
    key: string;
    value: {
      id: string;
      orderId: string;
      data: any; // Completion data
      timestamp: number;
      synced: boolean;
    };
  };
  'location-queue': {
    key: number;
    value: {
      id?: number;
      data: {
        latitude: number;
        longitude: number;
        accuracy: number;
        speed: number;
        heading: number;
        isMoving: boolean;
        batteryLevel: number;
      };
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  'offline-photos': {
    key: string;
    value: {
      id: string;
      orderId: string;
      blob: Blob;
      timestamp: number;
      synced: boolean;
    };
  };
}

let dbInstance: IDBPDatabase<DriverDB> | null = null;

/**
 * Open or get existing IndexedDB instance
 */
export async function getDB(): Promise<IDBPDatabase<DriverDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DriverDB>('blueice-driver', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log('[IndexedDB] Upgrading from version', oldVersion, 'to', newVersion);

      // Create todays-orders store
      if (!db.objectStoreNames.contains('todays-orders')) {
        const ordersStore = db.createObjectStore('todays-orders', { keyPath: 'id' });
        ordersStore.createIndex('by-status', 'status');
      }

      // Create pending-deliveries store
      if (!db.objectStoreNames.contains('pending-deliveries')) {
        db.createObjectStore('pending-deliveries', { keyPath: 'id' });
      }

      // Create location-queue store
      if (!db.objectStoreNames.contains('location-queue')) {
        const locationStore = db.createObjectStore('location-queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        locationStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create offline-photos store
      if (!db.objectStoreNames.contains('offline-photos')) {
        db.createObjectStore('offline-photos', { keyPath: 'id' });
      }
    },
    blocked() {
      console.warn('[IndexedDB] Database upgrade blocked');
    },
    blocking() {
      console.warn('[IndexedDB] Blocking database upgrade');
    },
  });

  return dbInstance;
}

// ==================== ORDERS CACHING ====================

/**
 * Cache today's orders for offline access
 */
export async function cacheTodaysOrders(orders: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('todays-orders', 'readwrite');
  const store = tx.objectStore('todays-orders');

  // Clear existing orders first
  await store.clear();

  // Add all orders
  await Promise.all(orders.map((order) => store.put(order)));

  await tx.done;
  console.log('[IndexedDB] Cached', orders.length, 'orders');
}

/**
 * Get cached orders when offline
 */
export async function getCachedOrders(): Promise<any[]> {
  const db = await getDB();
  const orders = await db.getAll('todays-orders');
  console.log('[IndexedDB] Retrieved', orders.length, 'cached orders');
  return orders;
}

/**
 * Update a single cached order (e.g., after completion)
 */
export async function updateCachedOrder(orderId: string, updates: Partial<any>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('todays-orders', 'readwrite');
  const store = tx.objectStore('todays-orders');

  const order = await store.get(orderId);
  if (order) {
    await store.put({ ...order, ...updates });
  }

  await tx.done;
}

// ==================== DELIVERY QUEUE ====================

/**
 * Queue delivery completion for sync when back online
 */
export async function queueDeliveryCompletion(orderId: string, completionData: any): Promise<void> {
  const db = await getDB();

  const delivery = {
    id: crypto.randomUUID(),
    orderId,
    data: completionData,
    timestamp: Date.now(),
    synced: false,
  };

  await db.put('pending-deliveries', delivery);

  console.log('[IndexedDB] Queued delivery for sync:', orderId);

  // Update cached order to show as completed locally
  await updateCachedOrder(orderId, {
    status: 'COMPLETED',
    deliveredAt: new Date().toISOString(),
  });

  // Request background sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-deliveries');
      console.log('[IndexedDB] Background sync registered');
    } catch (error) {
      console.error('[IndexedDB] Failed to register background sync:', error);
    }
  }
}

/**
 * Get all pending deliveries waiting to sync
 */
export async function getPendingDeliveries(): Promise<any[]> {
  const db = await getDB();
  const pending = await db.getAll('pending-deliveries');
  return pending.filter((d) => !d.synced);
}

/**
 * Get count of pending deliveries
 */
export async function getPendingDeliveriesCount(): Promise<number> {
  const pending = await getPendingDeliveries();
  return pending.length;
}

/**
 * Mark delivery as synced
 */
export async function markDeliverySynced(deliveryId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('pending-deliveries', 'readwrite');
  const store = tx.objectStore('pending-deliveries');

  const delivery = await store.get(deliveryId);
  if (delivery) {
    delivery.synced = true;
    await store.put(delivery);
  }

  await tx.done;
}

/**
 * Remove synced delivery from queue
 */
export async function removeSyncedDelivery(deliveryId: string): Promise<void> {
  const db = await getDB();
  await db.delete('pending-deliveries', deliveryId);
  console.log('[IndexedDB] Removed synced delivery:', deliveryId);
}

// ==================== LOCATION QUEUE ====================

/**
 * Queue location update for syncing
 */
export async function queueLocationUpdate(locationData: {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  isMoving: boolean;
  batteryLevel: number;
}): Promise<void> {
  const db = await getDB();

  const location = {
    data: locationData,
    timestamp: Date.now(),
  };

  await db.add('location-queue', location);

  // Request sync if available
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-location');
    } catch (error) {
      console.error('[IndexedDB] Failed to register location sync:', error);
    }
  }
}

/**
 * Get pending location updates
 */
export async function getPendingLocations(): Promise<any[]> {
  const db = await getDB();
  return await db.getAll('location-queue');
}

/**
 * Clear synced locations
 */
export async function clearSyncedLocations(): Promise<void> {
  const db = await getDB();
  await db.clear('location-queue');
  console.log('[IndexedDB] Cleared location queue');
}

// ==================== PHOTO STORAGE ====================

/**
 * Store photo offline for later upload
 */
export async function storeOfflinePhoto(orderId: string, blob: Blob): Promise<string> {
  const db = await getDB();

  const photoId = crypto.randomUUID();
  const photo = {
    id: photoId,
    orderId,
    blob,
    timestamp: Date.now(),
    synced: false,
  };

  await db.put('offline-photos', photo);

  console.log('[IndexedDB] Stored offline photo for order:', orderId);
  return photoId;
}

/**
 * Get all pending photos to upload
 */
export async function getPendingPhotos(): Promise<any[]> {
  const db = await getDB();
  const photos = await db.getAll('offline-photos');
  return photos.filter((p) => !p.synced);
}

/**
 * Mark photo as uploaded
 */
export async function markPhotoUploaded(photoId: string): Promise<void> {
  const db = await getDB();
  await db.delete('offline-photos', photoId);
  console.log('[IndexedDB] Removed uploaded photo:', photoId);
}

// ==================== STATS & UTILITIES ====================

/**
 * Get storage statistics
 */
export async function getStorageStats() {
  const db = await getDB();

  const [orders, deliveries, locations, photos] = await Promise.all([
    db.count('todays-orders'),
    db.count('pending-deliveries'),
    db.count('location-queue'),
    db.count('offline-photos'),
  ]);

  return {
    cachedOrders: orders,
    pendingDeliveries: deliveries,
    pendingLocations: locations,
    pendingPhotos: photos,
  };
}

/**
 * Clear all offline data (for testing or logout)
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB();

  await Promise.all([db.clear('todays-orders'), db.clear('pending-deliveries'), db.clear('location-queue'), db.clear('offline-photos')]);

  console.log('[IndexedDB] Cleared all offline data');
}
