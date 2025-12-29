import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';

/**
 * Update driver's current location
 */
export async function updateDriverLocation(data: {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  isMoving?: boolean;
  batteryLevel?: number;
}) {
  const { driverId, latitude, longitude, ...locationData } = data;

  // Update driver's current location
  await db.driverProfile.update({
    where: { id: driverId },
    data: {
      currentLat: latitude,
      currentLng: longitude,
      lastLocationUpdate: new Date(),
    },
  });

  // Store in location history
  const locationHistory = await db.driverLocationHistory.create({
    data: {
      driverId,
      latitude,
      longitude,
      ...locationData,
      timestamp: new Date(),
    },
  });

  return locationHistory;
}

/**
 * Get all active drivers with their current locations
 */
export async function getLiveDriverLocations() {
  const drivers = await db.driverProfile.findMany({
    where: {
      isOnDuty: true,
      currentLat: { not: null },
      currentLng: { not: null },
    },
    select: {
      id: true,
      currentLat: true,
      currentLng: true,
      lastLocationUpdate: true,
      isOnDuty: true,
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          imageUrl: true,
        },
      },
      vehicleNo: true,
      // Get most recent location history for movement/battery data
      locationHistory: {
        take: 1,
        orderBy: {
          timestamp: 'desc',
        },
        select: {
          isMoving: true,
          batteryLevel: true,
          speed: true,
        },
      },
      // Get current active order if any
      orders: {
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
        },
        take: 1,
        orderBy: {
          scheduledDate: 'desc',
        },
        select: {
          id: true,
          readableId: true,
          status: true,
          customer: {
            select: {
              user: {
                select: {
                  name: true,
                  phoneNumber: true,
                },
              },
              address: true,
              geoLat: true,
              geoLng: true,
            },
          },
        },
      },
    },
  });

  return drivers.map((driver) => {
    const latestLocation = driver.locationHistory[0];
    return {
      driverId: driver.id,
      name: driver.user.name,
      phoneNumber: driver.user.phoneNumber,
      imageUrl: driver.user.imageUrl,
      vehicleNo: driver.vehicleNo,
      latitude: driver.currentLat!,
      longitude: driver.currentLng!,
      lastUpdate: driver.lastLocationUpdate,
      isOnDuty: driver.isOnDuty,
      isMoving: latestLocation?.isMoving ?? false,
      batteryLevel: latestLocation?.batteryLevel ?? null,
      speed: latestLocation?.speed ?? null,
      currentOrder: driver.orders[0] || null,
    };
  });
}

/**
 * Get driver's route history for a specific date
 */
export async function getDriverRouteHistory(driverId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const locations = await db.driverLocationHistory.findMany({
    where: {
      driverId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
    select: {
      latitude: true,
      longitude: true,
      timestamp: true,
      speed: true,
      isMoving: true,
    },
  });

  // Calculate stats
  let totalDistance = 0;
  let totalSpeed = 0;
  let speedCount = 0;
  let stoppedDuration = 0;

  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];

    // Calculate distance using Haversine formula
    const distance = calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    totalDistance += distance;

    if (curr.speed) {
      totalSpeed += curr.speed;
      speedCount++;
    }

    // Calculate stopped duration
    if (!curr.isMoving) {
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000 / 60;
      stoppedDuration += timeDiff;
    }
  }

  return {
    locations: locations.map((loc) => ({
      lat: loc.latitude,
      lng: loc.longitude,
      timestamp: loc.timestamp,
      speed: loc.speed,
    })),
    stats: {
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
      averageSpeed: speedCount > 0 ? Math.round((totalSpeed / speedCount) * 100) / 100 : 0,
      stoppedDuration: Math.round(stoppedDuration), // In minutes
      dataPoints: locations.length,
    },
  };
}

/**
 * Toggle driver duty status
 */
export async function toggleDriverDutyStatus(driverId: string, isOnDuty: boolean) {
  return await db.driverProfile.update({
    where: { userId: driverId },
    data: { isOnDuty },
    select: {
      id: true,
      isOnDuty: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });
}

/**
 * Haversine formula to calculate distance between two coordinates
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Clean up old location history (keep last 30 days)
 */
export async function cleanupLocationHistory() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await db.driverLocationHistory.deleteMany({
    where: {
      timestamp: {
        lt: thirtyDaysAgo,
      },
    },
  });

  return deleted.count;
}
