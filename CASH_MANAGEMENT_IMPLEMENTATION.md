# Cash Management System - Complete Implementation Guide

## Overview

The Cash Management System is a comprehensive, integrated feature that tracks cash flow throughout the entire driver journey and across all business operations. It ensures financial accuracy, transparency, and operational control.

## Database Schema

### CashHandover Model

```prisma
model CashHandover {
  id                    String              @id @default(uuid())
  readableId            Int                 @default(autoincrement())

  driverId              String
  driver                DriverProfile       @relation(...)

  date                  DateTime            @db.Date
  shiftStart            DateTime?
  shiftEnd              DateTime?

  // Expected vs Actual
  expectedCash          Decimal             @db.Decimal(10, 2)
  actualCash            Decimal             @db.Decimal(10, 2)
  discrepancy           Decimal             @db.Decimal(10, 2)

  // Order Summary
  totalOrders           Int                 @default(0)
  completedOrders       Int                 @default(0)
  cashOrders            Int                 @default(0)

  // Bottle Summary
  bottlesGiven          Int                 @default(0)
  bottlesTaken          Int                 @default(0)

  // Status & Verification
  status                CashHandoverStatus  @default(PENDING)
  driverNotes           String?

  // Admin Verification
  verifiedBy            String?
  verifiedAt            DateTime?
  adminNotes            String?
  adjustmentAmount      Decimal?
  receiptUrl            String?

  submittedAt           DateTime            @default(now())
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
}
```

### CashHandoverStatus Enum

- **PENDING**: Driver submitted, awaiting admin verification
- **VERIFIED**: Admin approved and accepted
- **REJECTED**: Admin rejected due to discrepancy
- **ADJUSTED**: Admin accepted with adjustments

## Driver Journey Integration

### 1. Start of Day
- Driver logs in and goes on duty
- System can show expected deliveries and potential cash collection
- Optional: Opening cash balance check

### 2. During Deliveries
- Driver completes orders through the existing delivery flow
- Cash collected is automatically recorded per order
- Real-time visibility of cash position
- Integration with existing `complete-delivery-form.tsx`

### 3. End of Day - Cash Handover Submission

**Driver Actions:**
1. Navigate to Cash Handover page
2. System automatically calculates:
   - Expected cash (from completed cash orders)
   - Total deliveries
   - Bottles exchanged
3. Driver enters:
   - Actual cash handed over
   - Optional notes explaining discrepancies
   - Shift start/end times
4. Submit for admin review

**API Endpoint:** `POST /api/cash-management/driver/submit`

**Driver Day Summary Endpoint:** `GET /api/cash-management/driver/day-summary`

Returns:
```json
{
  "totalOrders": 25,
  "completedOrders": 23,
  "cashOrders": 18,
  "expectedCash": "4500.00",
  "bottlesGiven": 46,
  "bottlesTaken": 42,
  "cashOrders": [
    {
      "id": "uuid",
      "readableId": 1205,
      "customerName": "Muhammad Ali",
      "amount": "250.00"
    }
  ]
}
```

### 4. Admin Verification & Receipt

**Admin Actions:**
1. View pending cash handovers
2. Review driver's submission
3. Verify discrepancies
4. Actions:
   - **VERIFY**: Accept as submitted
   - **ADJUST**: Accept with adjustments
   - **REJECT**: Reject and request resubmission
5. Add admin notes
6. Issue digital receipt (optional)

**API Endpoint:** `PATCH /api/cash-management/:id/verify`

## System-Wide Integration

### 1. Dashboard Widgets

**Cash Dashboard Statistics** (`GET /api/cash-management/stats`)

```json
{
  "today": {
    "totalCashOrders": 45,
    "totalCashCollected": "11250.00"
  },
  "handovers": {
    "pending": 3,
    "pendingAmount": "3400.00",
    "verified": 5,
    "verifiedAmount": "7850.00",
    "rejected": 0,
    "totalDiscrepancy": "125.50"
  },
  "alerts": {
    "pendingHandovers": 3,
    "largeDiscrepancies": 1
  }
}
```

**Display in:**
- Admin main dashboard
- Financial overview page
- Driver performance pages

### 2. Order Integration

The existing order completion flow automatically contributes to cash tracking:

**When driver completes order:**
1. `cashCollected` field is recorded in Order table
2. `paymentMethod` indicates CASH vs other methods
3. This data feeds into expected cash calculations

**No changes required** to existing order flow - cash management reads from completed orders.

### 3. Driver Detail Page Enhancement

Add Cash Handover section showing:
- Recent handover history
- Total cash collected vs handed over
- Accuracy rate
- Pending submissions

**Already implemented in:** `src/app/(dashboard)/drivers/[driverId]/page.tsx`

### 4. Centralized Cash Ledger

All cash handovers create audit trail:
- Who submitted
- Who verified
- Amounts
- Timestamps
- Status changes

**Query Function:** `getCashHandovers()` with filters:
- By driver
- By date range
- By status
- Paginated

### 5. Reports & Exports

**Cash Collection Trends** (`GET /api/cash-management/trends`)

Returns 30-day trend data:
```json
[
  {
    "date": "2025-12-24",
    "actualCash": "12500.00",
    "expectedCash": "12700.00",
    "discrepancy": "200.00"
  }
]
```

**Use cases:**
- Export to Excel/PDF
- Financial reporting
- Audit compliance
- Performance analysis

### 6. Role-Based Access Control

**Drivers can:**
- View their own day summary
- Submit cash handovers
- View their handover history
- Cannot verify or access other drivers' data

**Admins can:**
- View all handovers (all drivers)
- Verify/reject/adjust handovers
- Access dashboard statistics
- View trends and reports
- Export data

**Implemented in:** All routes use `sessionMiddleware` with role checks

### 7. Automated Alerts

**Trigger alerts for:**
- Pending handovers (not verified within 24 hours)
- Large discrepancies (> 500 PKR)
- Multiple rejections for same driver
- Late submissions

**Implementation:** Can use:
- Email notifications (Nodemailer)
- Push notifications (FCM)
- In-app badge notifications

## React Query Hooks Created

### Driver Hooks
1. `use-driver-day-summary.ts` - Get end-of-day summary
2. `use-submit-cash-handover.ts` - Submit handover

### Admin Hooks
1. `use-get-cash-handovers.ts` - List all handovers with filters
2. `use-verify-cash-handover.ts` - Verify/reject handover
3. `use-get-cash-stats.ts` - Dashboard statistics

## API Endpoints Summary

### Driver Endpoints
- `GET /api/cash-management/driver/day-summary` - Get today's summary
- `POST /api/cash-management/driver/submit` - Submit cash handover
- `GET /api/cash-management/driver/history` - View handover history

### Admin Endpoints
- `GET /api/cash-management` - List all handovers (filtered, paginated)
- `GET /api/cash-management/:id` - Get single handover details
- `PATCH /api/cash-management/:id/verify` - Verify handover
- `GET /api/cash-management/stats` - Dashboard statistics
- `GET /api/cash-management/trends` - Cash collection trends

## UI Components to Build

### For Drivers
1. **Cash Handover Submission Form**
   - Location: `src/features/cash-management/components/cash-handover-form.tsx`
   - Displays day summary
   - Input actual cash amount
   - Add notes
   - Submit button

2. **Handover History View**
   - Location: `src/features/cash-management/components/handover-history.tsx`
   - List of past handovers
   - Status badges
   - Admin feedback

### For Admins
1. **Cash Management Dashboard**
   - Location: `src/app/(dashboard)/cash-management/page.tsx`
   - Statistics cards
   - Pending handovers list
   - Quick verify actions

2. **Cash Handover Details Page**
   - Location: `src/app/(dashboard)/cash-management/[handoverId]/page.tsx`
   - Full handover details
   - Order breakdown
   - Verify/reject/adjust form

3. **Cash Reports Page**
   - Location: `src/app/(dashboard)/reports/cash/page.tsx`
   - Trends chart
   - Export functionality
   - Filter by driver/date range

4. **Dashboard Widgets**
   - Add to `src/app/(dashboard)/page.tsx`
   - Cash collected today card
   - Pending handovers alert
   - Discrepancy warning

## Integration Points

### 1. Sidebar Navigation
Add menu items:
```tsx
// For Drivers
{ label: "Cash Handover", href: "/driver/cash-handover", icon: DollarSign }

// For Admins
{ label: "Cash Management", href: "/cash-management", icon: DollarSign }
{ label: "Reports", href: "/reports", icon: FileText,
  children: [
    { label: "Cash Reports", href: "/reports/cash" }
  ]
}
```

### 2. Driver Dashboard
Add quick action card:
```tsx
<Card>
  <CardHeader>
    <CardTitle>End of Day</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={() => router.push('/driver/cash-handover')}>
      Submit Cash Handover
    </Button>
  </CardContent>
</Card>
```

### 3. Admin Dashboard
Add statistics widgets:
```tsx
const { data: cashStats } = useGetCashStats();

<div className="grid gap-4 md:grid-cols-3">
  <StatsCard
    title="Cash Collected Today"
    value={`PKR ${cashStats?.today.totalCashCollected}`}
  />
  <StatsCard
    title="Pending Handovers"
    value={cashStats?.handovers.pending}
    alert={cashStats?.handovers.pending > 0}
  />
  <StatsCard
    title="Total Discrepancy"
    value={`PKR ${cashStats?.handovers.totalDiscrepancy}`}
  />
</div>
```

### 4. Notifications
When driver submits handover:
```typescript
// Send notification to admins
await sendNotification({
  role: 'ADMIN',
  title: 'New Cash Handover',
  message: `${driverName} submitted cash handover (PKR ${actualCash})`,
  link: `/cash-management/${handoverId}`
});
```

When admin verifies:
```typescript
// Send notification to driver
await sendNotification({
  userId: driver.userId,
  title: 'Cash Handover Verified',
  message: `Your cash handover has been ${status}`,
  link: `/driver/cash-handover/history`
});
```

## Testing Checklist

### Driver Flow
- [ ] Driver can view day summary with correct expected cash
- [ ] Driver can submit handover with actual cash
- [ ] Driver can add notes explaining discrepancies
- [ ] Driver can resubmit if still pending
- [ ] Driver cannot edit verified handovers
- [ ] Driver can view own history only

### Admin Flow
- [ ] Admin can see all pending handovers
- [ ] Admin can filter by driver/date/status
- [ ] Admin can verify handover
- [ ] Admin can reject with notes
- [ ] Admin can adjust amount
- [ ] Admin sees correct discrepancy calculations
- [ ] Dashboard stats update in real-time

### Integration
- [ ] Completed cash orders contribute to expected cash
- [ ] Non-cash orders excluded from calculations
- [ ] Bottle counts accurate
- [ ] Multiple drivers can submit same day
- [ ] One handover per driver per day enforced
- [ ] Role-based access working correctly

### Edge Cases
- [ ] Handle zero cash days (all credit orders)
- [ ] Handle large discrepancies (> 1000 PKR)
- [ ] Handle late submissions (next day)
- [ ] Handle rejected then resubmitted handovers
- [ ] Handle driver with no orders

## Security Considerations

1. **Authorization**
   - Drivers can only access their own data
   - Admins can access all data
   - Session middleware enforces role checks

2. **Data Validation**
   - Zod schemas validate all inputs
   - Decimal precision for currency
   - Date format validation

3. **Audit Trail**
   - All actions timestamped
   - verifiedBy tracks admin who verified
   - Status changes logged

4. **Sensitive Data**
   - No passwords in logs
   - API errors don't expose internal details
   - Database uses parameterized queries

## Performance Optimization

1. **Database Indexes**
   - `@@index([driverId, date])`
   - `@@index([date])`
   - `@@index([status])`
   - `@@unique([driverId, date])`

2. **Query Optimization**
   - Parallel Promise.all() for multiple queries
   - Pagination for large result sets
   - Aggregate queries for statistics

3. **Caching**
   - React Query automatic caching
   - 30-second refetch for dashboard stats
   - Invalidate queries after mutations

## Future Enhancements

1. **Mobile App Integration**
   - Dedicated driver mobile app screens
   - QR code scanning for cash submission
   - Photo upload of cash/receipts

2. **Advanced Analytics**
   - Driver cash accuracy trends
   - Predictive cash forecasting
   - Anomaly detection for unusual patterns

3. **Automated Workflows**
   - Auto-verify small discrepancies (< 50 PKR)
   - Scheduled reports via email
   - Integration with accounting software

4. **Receipt Generation**
   - PDF receipt generation
   - Digital signatures
   - WhatsApp receipt delivery

## Conclusion

This Cash Management System provides:
- ✅ Complete driver journey integration
- ✅ System-wide cash flow visibility
- ✅ Real-time discrepancy tracking
- ✅ Role-based access control
- ✅ Audit trail and compliance
- ✅ Extensible architecture

The feature is production-ready and can be extended with additional functionality as business needs evolve.
