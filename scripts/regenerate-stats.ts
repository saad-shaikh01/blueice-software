import { startOfDay } from 'date-fns';

import { aggregateDailyStats } from '@/lib/cron/aggregate-daily-stats';
import { db } from '@/lib/db';

async function regenerateStats() {
  console.log('Starting DailyStats regeneration...');

  // 1. Get all dates that have orders
  const orders = await db.order.findMany({
    select: { scheduledDate: true },
    distinct: ['scheduledDate'],
    orderBy: { scheduledDate: 'asc' },
  });

  console.log(`Found ${orders.length} days with orders.`);

  for (const order of orders) {
    const date = startOfDay(order.scheduledDate);
    console.log(`Processing ${date.toISOString()}...`);
    try {
      await aggregateDailyStats(date);
    } catch (error) {
      console.error(`Failed to process ${date.toISOString()}:`, error);
    }
  }

  console.log('Regeneration complete.');
}

regenerateStats()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
