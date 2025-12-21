# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blue Ice CRM is a water supply business management system built with Next.js 14, designed for managing customer orders, delivery routes, inventory, and financial tracking for a bottled water distribution business in Pakistan. The system handles residential, commercial, and corporate customers with features like route optimization, bottle exchange tracking, wallet systems, and automated order scheduling.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **API Layer**: Hono.js (type-safe API routes)
- **Authentication**: JWT-based (custom implementation with bcrypt)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI + Tailwind CSS
- **Theme**: next-themes (dark/light mode with water-supply theme)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Email**: Nodemailer
- **Rich Text**: TipTap editor

## Development Commands

```bash
# Development server (runs on port 3004)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint          # Check linting issues
npm run lint:fix      # Auto-fix linting issues

# Formatting
npm run format        # Check formatting
npm run format:fix    # Auto-fix formatting

# Database
npx prisma migrate dev        # Create and apply migrations
npx prisma generate           # Generate Prisma Client
npx prisma studio             # Open Prisma Studio GUI
npx prisma db push            # Push schema changes without migrations
```

## Architecture

### Route Structure (Next.js App Router)

- `(auth)/*` - Authentication pages (sign-in, sign-up, password reset)
- `(dashboard)/*` - Main application dashboard with Sidebar + Navbar layout
- `(standalone)/*` - Standalone pages (profile settings) without dashboard chrome
- `api/[[...route]]/route.ts` - Catch-all API route handler for Hono

### Feature-Based Organization

Features live in `src/features/` and follow this structure:

```
src/features/{feature}/
  ├── api/              # Client-side React Query hooks (use-*.ts)
  ├── components/       # Feature-specific React components
  ├── hooks/            # Feature-specific React hooks
  ├── server/           # Hono API route handlers
  │   └── route.ts      # API endpoints for this feature
  ├── schema.ts         # Zod validation schemas
  ├── queries.ts        # Prisma database queries
  ├── type.ts           # TypeScript types
  └── constants.ts      # Feature constants
```

Example: `src/features/auth/` contains all authentication-related code.

### API Architecture (Hono.js)

1. **Route Registration**: Feature API routes are registered in `src/app/api/[[...route]]/route.ts`:
   ```typescript
   const routes = app.route('/auth', auth)
   export type AppType = typeof routes
   ```

2. **Client Setup**: Type-safe client created in `src/lib/hono.ts`:
   ```typescript
   export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_BASE_URL!)
   ```

3. **Feature Routes**: Each feature defines its routes in `server/route.ts`

4. **Authentication**: Protected routes use `sessionMiddleware` from `src/lib/session-middleware.ts` which:
   - Checks for JWT in cookie (`AUTH_COOKIE`)
   - Verifies token using `verifyToken()` from `src/lib/authenticate.ts`
   - Sets `userId` and `user` in Hono context

### Database Architecture (Prisma)

The schema follows a water distribution business model:

**Core Models:**
- `User` - Authentication (email/phone, role-based: SUPER_ADMIN, ADMIN, DRIVER, CUSTOMER, INVENTORY_MGR)
- `CustomerProfile` - Extended customer data (location, route, delivery schedule, financials)
- `DriverProfile` - Driver details and live tracking
- `Product` - Inventory items (bottles, dispensers) with returnable tracking
- `Order` - Delivery orders with status tracking
- `OrderItem` - Line items with bottle exchange tracking (filledGiven, emptyTaken)
- `Route` - Delivery routes for grouping customers
- `CustomerBottleWallet` - Track bottles held by each customer per product
- `CustomerProductPrice` - Custom pricing per customer
- `Ledger` - Financial transaction history
- `AuditLog` - Action tracking for compliance

**Key Business Logic:**
- Bottle exchange system: tracks filled bottles given vs empty bottles returned
- Financial wallet: `cashBalance` can be positive (advance) or negative (credit/udhaar)
- Credit limits: `creditLimit` prevents excessive debt
- Delivery scheduling: `deliveryDays` array (1=Monday, 4=Thursday, etc.)
- Route optimization: `sequenceOrder` for driver routes
- Floor-based pricing: `floorNumber` and `hasLift` affect delivery charges

### State Management

- **TanStack Query**: Used for all server state (API calls)
- **Client hooks pattern**: Each API endpoint has a corresponding `use-*.ts` hook in `features/{feature}/api/`
- **Query invalidation**: Mutations invalidate related queries for cache consistency

### UI Components

- **Base Components**: `src/components/ui/` - Radix UI wrappers with Tailwind styling
- **Shared Components**: `src/components/` - App-wide reusable components
- **Feature Components**: `src/features/{feature}/components/` - Feature-specific UI

### Theming

- Uses `next-themes` for dark/light mode switching
- Theme attribute: `class` (Tailwind's darkMode strategy)
- Default: `system` (follows OS preference)
- CSS variables defined in `src/app/globals.css` for HSL color tokens
- Water-supply themed with blue gradients and glassmorphism effects

## Important Patterns

### Authentication Flow
1. User signs in via `/auth/login` API endpoint
2. Server validates credentials, generates JWT token
3. Token stored in HTTP-only cookie (`AUTH_COOKIE`)
4. Protected routes check cookie via `sessionMiddleware`
5. Client hooks (`use-current.ts`) fetch user data

### Firebase Push Notifications
- FCM tokens stored in `User.fcmTokens` array (supports multiple devices)
- Service worker setup in `src/components/firebase-forground.tsx`
- Admin SDK in `src/lib/firebase-admin.ts` for server-side sending

### File Upload
- AWS S3 integration via `@aws-sdk/client-s3`
- Upload utilities in `src/lib/upload.ts`
- Presigned URLs for direct client uploads

### Rich Text Editing
- TipTap for WYSIWYG editing with mentions support
- Utility functions:
  - `src/lib/renderTipTapJsonToHtml.ts` - Convert TipTap JSON to HTML
  - `src/lib/getPlainTextFromTipTap.ts` - Extract plain text

## Code Style

### Prettier Configuration (.prettierrc.mjs)
- Semi-colons: required
- Quotes: single
- Tab width: 2 spaces
- Print width: 140 characters
- Import order: third-party → `@/*` imports → relative imports
- Automatic import sorting and Tailwind class sorting

### Path Aliases
- `@/*` maps to `src/*` (configured in tsconfig.json)
- Always use absolute imports with `@/` prefix

### Naming Conventions
- Components: PascalCase
- Hooks: camelCase with `use` prefix
- API hooks: `use-{action}.ts` (e.g., `use-login.ts`)
- Server routes: `route.ts`
- Schemas: `schema.ts` with Zod
- Types: `type.ts`

## Database Workflow

1. **Schema Changes**: Edit `prisma/schema.prisma`
2. **Create Migration**: `npx prisma migrate dev --name description_of_change`
3. **Generate Client**: Automatically runs, or manually `npx prisma generate`
4. **Apply in Production**: `npx prisma migrate deploy`

## Environment Variables

Required variables (check `.env` file):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `NEXT_PUBLIC_APP_BASE_URL` - Base URL for API client
- Firebase credentials for push notifications
- AWS S3 credentials for file uploads
- SMTP credentials for email

## Key Libraries

- **@hello-pangea/dnd** - Drag and drop functionality
- **react-big-calendar** - Calendar/scheduling views
- **nuqs** - Type-safe URL search params
- **sonner** - Toast notifications
- **cmdk** - Command palette component
- **vaul** - Drawer component
