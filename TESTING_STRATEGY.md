# End-to-End (E2E) Testing Strategy for Blue Ice CRM

This document outlines the comprehensive strategy for End-to-End testing of the Blue Ice CRM application using **Playwright**. The goal is to verify that all integrated components (Frontend, Backend, Database, Third-party services) work together correctly to deliver business value.

## 1. Testing Framework & Configuration

-   **Framework**: Playwright (TypeScript)
-   **Configuration**: `playwright.config.ts`
-   **Execution Mode**: Sequential (`workers: 1`) to avoid database race conditions.
-   **Data Seeding**: Use `tests/global.setup.ts` to wipe and seed the database before test runs.
-   **Authentication**: Use `storageState` to cache Admin and Driver sessions to speed up tests.

## 2. Core Test Scenarios

### 🔐 Authentication & RBAC
*Target: `src/features/auth`*
1.  **Admin Login**: Verify successful login with valid credentials (redirects to Dashboard).
2.  **Driver Login**: Verify successful login (redirects to `/deliveries`).
3.  **Invalid Login**: Verify error messages for wrong password/user.
4.  **Protected Routes**: Attempt to access `/dashboard` as an unauthenticated user (redirects to `/sign-in`).
5.  **Role Guard**: Attempt to access `/expenses` (Admin only) as a Driver (expect 403 or redirect).

### 👥 Customer Management
*Target: `src/features/customers`*
1.  **Create Customer**:
    -   Fill form (Name, Phone, Address).
    -   Assign Route & Sequence.
    -   Verify customer appears in list.
2.  **Search & Filter**:
    -   Search by Name/Phone.
    -   Verify URL params update (`?q=...`).
3.  **Customer Dashboard**:
    -   Navigate to `[customerId]/page.tsx`.
    -   Verify Bottle Wallet, Ledger Balance, and Order History load.

### 📦 Products & Inventory
*Target: `src/features/products`*
1.  **CRUD Operations**: Create new product, Edit price, Delete product.
2.  **Inventory Tracking**:
    -   Manually adjust stock.
    -   Verify "Low Stock" badge appears on Dashboard when stock < 20.

### 🚚 Order Lifecycle (Critical Path)
*Target: `src/features/orders`*
1.  **Create Order**:
    -   Admin creates order for Customer.
    -   Select Product & Quantity.
    -   Verify total calculation.
2.  **Assign Driver**:
    -   Edit Order -> Select Driver.
    -   Verify Order Status changes to `PENDING` (or remains `SCHEDULED`).
3.  **Driver Completion (Mobile View)**:
    -   **Login as Driver**.
    -   Navigate to assigned order.
    -   **Complete Order**:
        -   Input Bottles Delivered / Returned.
        -   Input Cash Collected.
        -   Tap "Complete".
    -   Verify Success Toast.
4.  **Verification**:
    -   **Login as Admin**.
    -   Verify Order Status is `COMPLETED`.
    -   Verify Inventory deducted.
    -   Verify Customer Ledger updated.
    -   Verify Cash Handover "Pending" amount increased.

### 🗺️ Routes & Optimization
*Target: `src/features/routes`*
1.  **Route Creation**: Create a new route.
2.  **Assignment**: Assign multiple customers to the route.
3.  **Filtering**: Filter Order Table by "Route" and verify only relevant orders show.

### 💰 Cash Management & Expenses
*Target: `src/features/finance`*
1.  **Expense Logging**:
    -   Driver logs an expense (Fuel).
    -   Admin verifies expense appears in "Pending" state.
    -   Admin approves expense.
2.  **Cash Handover**:
    -   Driver creates Handover Report.
    -   Admin verifies "Expected Cash" vs "Actual Cash".
    -   Admin marks Handover as `VERIFIED`.

### 📊 Dashboard Analytics
*Target: `src/features/dashboard`*
1.  **Metric Accuracy**:
    -   Check "Total Revenue" matches sum of completed orders.
    -   Check "Active Customers" count.
2.  **Date Filtering**:
    -   Switch between "Today", "Last 7 Days".
    -   Verify charts update (snapshot comparison).
3.  **Error Handling**:
    -   Mock API failure (500).
    -   Verify "Failed to load" error state (using `page.route` mocking).

## 3. Implementation Plan

### Phase 1: Foundation (Setup)
-   [x] Configure `playwright.config.ts`.
-   [ ] Create `tests/fixtures` for reusable data (Test Admin, Test Driver).
-   [ ] Implement `global.setup.ts` to seed fresh DB state.

### Phase 2: Critical Paths
-   [ ] `tests/auth.spec.ts`: Login/Logout/RBAC.
-   [ ] `tests/order-flow.spec.ts`: Full lifecycle (Admin Create -> Driver Complete -> Admin Verify).

### Phase 3: Feature Coverage
-   [ ] `tests/customers.spec.ts`: CRUD and Search.
-   [ ] `tests/dashboard.spec.ts`: Analytics verification.
-   [ ] `tests/finance.spec.ts`: Cash handover and expenses.

## 4. Continuous Integration (CI)

To ensure stability, these tests should run on every Pull Request:
1.  **GitHub Actions Workflow**:
    -   Spin up Postgres container (Service container).
    -   Run Migrations & Seed.
    -   Start Next.js server (`npm run dev`).
    -   Run `npx playwright test`.
    -   Upload Artifacts (Screenshots/Traces) on failure.

## 5. Tools & Commands

-   **Run Headless**: `npx playwright test`
-   **Run UI Mode**: `npx playwright test --ui` (Great for debugging)
-   **Debug**: `npx playwright test --debug`
-   **Codegen**: `npx playwright codegen localhost:3004` (Record actions to generate code)

---
*Created by Jules*
