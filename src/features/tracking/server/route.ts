import { Hono } from 'hono';
import { db } from '@/lib/db';
import { sessionMiddleware } from '@/lib/session-middleware';
import { UserRole } from '@prisma/client';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  isOnDuty: z.boolean().optional(),
});

const app = new Hono()
  .get('/', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    // Only admins can see live tracking
    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      // Fetch active drivers (updated in last 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const activeDrivers = await db.driverProfile.findMany({
        where: {
          currentLat: { not: null },
          currentLng: { not: null },
          // user: { isActive: true }, // Add this if you want only active users
        },
        include: {
          user: {
            select: {
              name: true,
              phoneNumber: true,
              imageUrl: true,
            }
          },
          orders: {
            where: {
              status: 'IN_PROGRESS'
            },
            take: 1,
            include: {
              customer: {
                include: {
                  user: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      const formattedDrivers = activeDrivers.map(d => ({
        driverId: d.id,
        name: d.user.name,
        phoneNumber: d.user.phoneNumber,
        imageUrl: d.user.imageUrl,
        vehicleNo: d.vehicleNo,
        latitude: d.currentLat,
        longitude: d.currentLng,
        isOnDuty: true, // You might want to add this field to DriverProfile
        lastUpdate: new Date().toISOString(), // Mock for now, add updated_at to location log if needed
        currentOrder: d.orders[0] ? {
          id: d.orders[0].id,
          readableId: d.orders[0].readableId,
          customerName: d.orders[0].customer.user.name
        } : null
      }));

      return ctx.json({
        drivers: formattedDrivers,
        count: formattedDrivers.length,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch tracking data' }, 500);
    }
  })
  .post('/update', sessionMiddleware, zValidator('json', updateLocationSchema), async (ctx) => {
    const user = ctx.get('user');
    const { latitude, longitude, isOnDuty } = ctx.req.valid('json');

    // Only drivers can update their location
    if (user.role !== UserRole.DRIVER) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      const driverProfile = await db.driverProfile.findUnique({
        where: { userId: user.id }
      });

      if (!driverProfile) {
        return ctx.json({ error: 'Driver profile not found' }, 404);
      }

      await db.driverProfile.update({
        where: { id: driverProfile.id },
        data: {
          currentLat: latitude,
          currentLng: longitude,
          // isOnDuty: isOnDuty // Add if schema supports
        }
      });

      // WebSocket broadcast could go here
      // (global as any).io?.emit('driver-location-update', { driverId: user.driverProfile.id, lat: latitude, lng: longitude });

      return ctx.json({ success: true });
    } catch (error) {
      return ctx.json({ error: 'Failed to update location' }, 500);
    }
  });

export default app;
