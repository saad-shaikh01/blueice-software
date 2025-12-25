import { NextRequest, NextResponse } from 'next/server';
import { aggregateDailyStats, cleanupOldLocationHistory } from '@/lib/cron/aggregate-daily-stats';
import { subDays } from 'date-fns';

/**
 * Cron endpoint for aggregating daily statistics
 *
 * This endpoint should be called daily (preferably at midnight) by a cron service.
 *
 * For Vercel: Add this to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/aggregate-stats",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * For other platforms: Set up a cron job to hit this endpoint daily:
 * 0 0 * * * curl -X POST https://your-domain.com/api/cron/aggregate-stats \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * Security: Requests must include either:
 * 1. Vercel Cron Secret header (for Vercel cron jobs)
 * 2. Authorization Bearer token matching CRON_SECRET env variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Check Vercel cron secret (if using Vercel cron)
    const vercelCronSecret = request.headers.get('x-vercel-cron-secret');
    const expectedVercelSecret = process.env.CRON_SECRET;

    const isVercelCron = vercelCronSecret && vercelCronSecret === expectedVercelSecret;
    const isAuthorized = authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const backfillDays = searchParams.get('backfill');

    const results = [];

    if (backfillDays) {
      // Backfill mode: aggregate stats for the last N days
      const days = parseInt(backfillDays, 10);
      if (isNaN(days) || days < 1 || days > 90) {
        return NextResponse.json({ error: 'Invalid backfill parameter. Must be between 1-90.' }, { status: 400 });
      }

      console.log(`[CRON] Backfilling ${days} days of statistics`);

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const stats = await aggregateDailyStats(date);
        results.push({
          date: date.toISOString().split('T')[0],
          ordersCompleted: stats.ordersCompleted,
          revenue: Number(stats.totalRevenue),
        });
      }
    } else {
      // Single day mode
      const date = dateParam ? new Date(dateParam) : new Date();

      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
      }

      const stats = await aggregateDailyStats(date);
      results.push({
        date: date.toISOString().split('T')[0],
        ordersCompleted: stats.ordersCompleted,
        revenue: Number(stats.totalRevenue),
        cashCollected: Number(stats.cashCollected),
        bottlesDelivered: stats.bottlesDelivered,
        activeDrivers: stats.driversActive,
      });
    }

    // Also run cleanup for old location data
    const cleanupResult = await cleanupOldLocationHistory();

    return NextResponse.json({
      success: true,
      message: 'Daily statistics aggregated successfully',
      results,
      cleanup: {
        deletedRecords: cleanupResult.count,
      },
    });
  } catch (error) {
    console.error('[CRON] Error in aggregate-stats endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

/**
 * GET handler for manual testing
 * Returns the last aggregated daily stats
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization (same as POST)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return aggregation status info
    return NextResponse.json({
      message: 'Cron job endpoint is active',
      usage: {
        post: 'POST /api/cron/aggregate-stats - Run aggregation',
        parameters: {
          date: 'Optional: YYYY-MM-DD format to aggregate specific date',
          backfill: 'Optional: Number of days (1-90) to backfill',
        },
        examples: [
          'POST /api/cron/aggregate-stats (aggregate today)',
          'POST /api/cron/aggregate-stats?date=2024-01-15 (aggregate specific date)',
          'POST /api/cron/aggregate-stats?backfill=7 (aggregate last 7 days)',
        ],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
