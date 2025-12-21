# Customer Onboarding Feature

This module handles customer creation with support for both **new signups** and **legacy data migration**.

## 📁 File Structure

```
src/features/customers/
├── schema.ts           # Zod validation schemas
├── queries.ts          # Prisma database queries with transaction logic
├── types.ts            # TypeScript type definitions
├── server/
│   └── route.ts        # Hono API routes
├── api/                # (Future) React Query hooks
├── components/         # (Future) UI components
└── hooks/              # (Future) Custom React hooks
```

## 🎯 Key Features

### 1. **Legacy Data Migration Support**
When creating a customer with opening balances > 0:
- Creates User + CustomerProfile in a **Prisma transaction**
- Inserts Ledger entry: `"Opening Balance Migration"`
- Inserts CustomerBottleWallet entry (if bottle balance > 0)
- Ensures data integrity with atomic operations

### 2. **Regular Customer Signup**
When opening balances = 0:
- Simply creates User + CustomerProfile
- No extra ledger/wallet entries

### 3. **Invoice Context Retrieval**
GET endpoint returns customer + **last 5 orders** to mimic paper invoices

## 🔧 API Endpoints

### POST `/api/customers`
Create a new customer

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MGR only

**Request Body:**
```json
{
  // User Information
  "name": "Ahmed Khan",
  "phoneNumber": "03001234567",
  "email": "ahmed@example.com",
  "password": "securepass123",

  // Legacy Migration (optional)
  "manualCode": "L-3442",
  "openingCashBalance": "5000.50",
  "openingBottleBalance": 10,
  "productId": "uuid-of-product",

  // Location
  "area": "Gulshan Block 4",
  "address": "House 123, Street 5, Gulshan-e-Iqbal",
  "landmark": "Near Madina Masjid",
  "floorNumber": 2,
  "hasLift": false,
  "geoLat": 24.9056,
  "geoLng": 67.0822,

  // Routing
  "routeId": "uuid-of-route",
  "sequenceOrder": 5,

  // Business Logic
  "type": "RESIDENTIAL",
  "deliveryDays": [1, 4], // Monday, Thursday
  "creditLimit": "3000.00"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "manualCode": "L-3442",
    "area": "Gulshan Block 4",
    "cashBalance": "5000.50",
    "openingCashBalance": "5000.50",
    "openingBottleBalance": 10,
    "user": { ... },
    "route": { ... }
  },
  "message": "Customer created successfully"
}
```

### GET `/api/customers`
Get all customers with filtering and pagination

**Query Parameters:**
- `search`: Search by name, phone, email, address, manualCode
- `area`: Filter by area
- `type`: Filter by customer type (RESIDENTIAL, COMMERCIAL, CORPORATE)
- `routeId`: Filter by route
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### GET `/api/customers/:id`
Get single customer with order history (last 5 orders)

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "user": { ... },
    "route": { ... },
    "orders": [ /* Last 5 orders with items and driver */ ],
    "bottleWallets": [ /* Current bottle holdings */ ],
    "ledgers": [ /* Last 10 transactions */ ],
    "cashBalance": "1500.00",
    "creditLimit": "3000.00"
  }
}
```

### PATCH `/api/customers/:id`
Update customer profile

**Authorization:** SUPER_ADMIN, ADMIN, INVENTORY_MGR only

**Request Body:** (all fields optional)
```json
{
  "name": "Ahmed Khan Updated",
  "phoneNumber": "03009876543",
  "area": "DHA Phase 6",
  "deliveryDays": [1, 3, 5],
  "creditLimit": "5000.00"
}
```

## 🔐 Business Rules (Enforced by Zod)

1. **Phone Number**: Minimum 10 digits, required
2. **Email**: Valid email format, optional
3. **Manual Code**: Must match format `L-3442`, unique
4. **Delivery Days**:
   - Array of integers (0-6, where 0=Sunday, 6=Saturday)
   - Must be unique (no duplicates)
   - At least one day required
5. **Opening Bottle Balance**:
   - If > 0, `productId` is **required**
   - Must be non-negative integer
6. **Financial Fields**:
   - All amounts use `Prisma.Decimal` for precision
   - Credit limit must be positive
7. **Floor Number**: Must be >= 0 (0 = Ground floor)

## 🔄 Migration Transaction Flow

```
START TRANSACTION
  ↓
1. Create User (with CUSTOMER role)
  ↓
2. Create CustomerProfile (with opening balances)
  ↓
3. IF openingCashBalance > 0:
   → Insert Ledger entry
  ↓
4. IF openingBottleBalance > 0 AND productId exists:
   → Verify product exists
   → Insert CustomerBottleWallet entry
  ↓
COMMIT TRANSACTION
```

If any step fails, **entire transaction is rolled back**.

## 📊 Database Schema Updates

### CustomerProfile Model
```prisma
model CustomerProfile {
  // ... existing fields ...

  // NEW: Legacy Migration Support
  manualCode           String?  @unique
  openingCashBalance   Decimal  @default(0) @db.Decimal(10, 2)
  openingBottleBalance Int      @default(0)
}
```

## 🧪 Testing Checklist

- [ ] Create new customer (opening balance = 0)
- [ ] Migrate legacy customer with cash balance
- [ ] Migrate legacy customer with bottle balance
- [ ] Migrate with both cash + bottle balances
- [ ] Verify Ledger entry created for migration
- [ ] Verify CustomerBottleWallet created for bottles
- [ ] Test unique constraint violations (phone, email, manualCode)
- [ ] Test authorization (only admins can create)
- [ ] Test validation errors (missing required fields)
- [ ] Test GET with filters and pagination
- [ ] Test GET single customer with order history

## 🚀 Next Steps

1. **Run migration**: `npx prisma migrate dev --name add_customer_onboarding_fields`
2. **Generate Prisma Client**: `npx prisma generate`
3. **Test API endpoints** using Postman/Thunder Client
4. **Build UI components** in `components/` folder
5. **Create React Query hooks** in `api/` folder

## 💡 Usage Example

```typescript
// Create a legacy customer with existing balances
const response = await fetch('/api/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Ali Raza',
    phoneNumber: '03001234567',
    password: 'password123',
    manualCode: 'L-5678',
    area: 'Clifton',
    address: 'Block 2, Clifton',
    type: 'COMMERCIAL',
    deliveryDays: [1, 3, 5],
    openingCashBalance: '8000.00',
    openingBottleBalance: 15,
    productId: 'product-uuid-here',
  })
});
```

## ⚠️ Important Notes

- **Do NOT** manually modify `cashBalance` or `bottleWallets` - use transactions/orders
- **Opening balances** are immutable after creation (audit trail)
- **Manual codes** must be unique across all customers
- All financial calculations use `Decimal` type (not floats) for accuracy
