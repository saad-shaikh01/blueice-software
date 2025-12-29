# Cron Job Dependency & Fallback Strategy

## The Issue

The Comprehensive Dashboard relies on a "Hybrid Architecture":

1.  **Historical Data**: Fetched from the `DailyStats` table (aggregated nightly by a cron job).
2.  **Live Data**: Fetched directly from the `Order` table (today/current period).

### The Risk

If the nightly cron job (`src/lib/cron/aggregate-daily-stats.ts`) fails to run for any reason (server downtime, error, misconfiguration), the `DailyStats` table will **not have an entry** for the previous day.

**Consequence**:
When the dashboard queries for a date range that includes that missing day, it will report **zero revenue and zero orders** for that day, even if thousands of orders exist in the `Order` table. This leads to false alarms and mistrust in the system.

## Proposed Solution: "Smart Fallback"

We should modify `getComprehensiveDashboardData` to detect missing historical data and fall back to raw aggregation on-the-fly.

### Implementation Logic

```typescript
// Pseudo-code for the fallback logic

// 1. Fetch existing DailyStats
const dailyStats = await db.dailyStats.findMany({ ... });

// 2. Identify missing dates
const expectedDates = getDatesInRange(startDate, historicalEnd);
const foundDates = dailyStats.map(s => s.date.toISOString());
const missingDates = expectedDates.filter(d => !foundDates.includes(d));

// 3. Fallback: Aggregate Missing Dates from Raw Orders
if (missingDates.length > 0) {
  console.warn(`[Dashboard] Missing DailyStats for ${missingDates.length} days. Falling back to raw aggregation.`);

  const rawFallbackStats = await db.order.aggregate({
    where: {
      scheduledDate: { in: missingDates },
      status: OrderStatus.COMPLETED
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  // Merge rawFallbackStats into the historical totals
  historicalRevenue += Number(rawFallbackStats._sum.totalAmount || 0);
  historicalCompletedOrders += rawFallbackStats._count.id;
}
```

### Benefits

1.  **Resilience**: Dashboard always shows accurate numbers, even if the cron fails.
2.  **Self-Healing**: The next time the cron runs (or is manually triggered), `DailyStats` will be populated, and the dashboard will revert to using the optimized table.

### Next Steps

This fallback mechanism should be implemented in `src/features/dashboard/queries-comprehensive.ts` in a follow-up task.
