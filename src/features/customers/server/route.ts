import { zValidator } from '@hono/zod-validator';
import { Prisma, UserRole } from '@prisma/client';
import { Hono } from 'hono';

import {
  checkCustomerCodeExists,
  createCustomerWithProfile,
  deleteCustomer,
  generateNextCustomerCode,
  getCustomerWithOrderHistory,
  getCustomers,
  updateCustomerProfile,
} from '@/features/customers/queries';
import { createCustomerSchema, getCustomersQuerySchema, updateCustomerSchema } from '@/features/customers/schema';
import { generateToken } from '@/lib/authenticate';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  /**
   * GET /api/customers/generate-code
   * Generate next available customer code (C-1001, C-1002, etc.)
   */
  .get('/generate-code', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    // Only SUPER_ADMIN, ADMIN, and INVENTORY_MGR can generate codes
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.INVENTORY_MGR) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      const code = await generateNextCustomerCode();
      return ctx.json({ data: { code } });
    } catch (error) {
      console.error('[GENERATE_CUSTOMER_CODE]:', error);
      return ctx.json({ error: 'Failed to generate customer code' }, 500);
    }
  })

  /**
   * GET /api/customers/check-code/:code
   * Check if a customer code already exists
   */
  .get('/check-code/:code', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    // Only SUPER_ADMIN, ADMIN, and INVENTORY_MGR can check codes
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.INVENTORY_MGR) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const { code } = ctx.req.param();

    try {
      const exists = await checkCustomerCodeExists(code);
      return ctx.json({ data: { exists } });
    } catch (error) {
      console.error('[CHECK_CUSTOMER_CODE]:', error);
      return ctx.json({ error: 'Failed to check customer code' }, 500);
    }
  })

  /**
   * POST /api/customers
   * Create a new customer with optional legacy data migration
   *
   * Business Logic:
   * - If openingCashBalance > 0 OR openingBottleBalance > 0: Migration mode
   *   - Creates User + CustomerProfile
   *   - Inserts Ledger entry with "Opening Balance Migration"
   *   - Inserts CustomerBottleWallet entry
   * - If opening balances = 0: Regular signup
   *   - Just creates User + CustomerProfile
   */
  .post('/', sessionMiddleware, zValidator('json', createCustomerSchema), async (ctx) => {
    const user = ctx.get('user');

    // Only SUPER_ADMIN, ADMIN, and INVENTORY_MGR can create customers
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.INVENTORY_MGR) {
      return ctx.json({ error: 'Unauthorized: Only admins can create customers' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const customer = await createCustomerWithProfile({
        ...data,
        email: data.email ?? null,
      });

      return ctx.json({
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error) {
      console.error('[CREATE_CUSTOMER]:', error);

      // Handle Prisma unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('phoneNumber')) {
            return ctx.json({ error: 'Phone number already exists' }, 400);
          }
          if (target.includes('email')) {
            return ctx.json({ error: 'Email already exists' }, 400);
          }
          if (target.includes('manualCode')) {
            return ctx.json({ error: 'Manual code already exists' }, 400);
          }
        }
      }

      // Handle general errors
      if (error instanceof Error) {
        return ctx.json({ error: error.message }, 400);
      }

      return ctx.json({ error: 'Failed to create customer' }, 500);
    }
  })

  /**
   * GET /api/customers
   * Get all customers with filtering and pagination
   */
  .get('/', sessionMiddleware, zValidator('query', getCustomersQuerySchema), async (ctx) => {
    const params = ctx.req.valid('query');

    try {
      const result = await getCustomers(params);

      return ctx.json({
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('[GET_CUSTOMERS]:', error);
      return ctx.json({ error: 'Failed to fetch customers' }, 500);
    }
  })

  /**
   * GET /api/customers/:id
   * Get single customer with order history (last 5 orders)
   * This mimics paper invoice context showing recent deliveries
   */
  .get('/:id', sessionMiddleware, async (ctx) => {
    const { id } = ctx.req.param();

    try {
      const customer = await getCustomerWithOrderHistory(id);

      if (!customer) {
        return ctx.json({ error: 'Customer not found' }, 404);
      }

      return ctx.json({ data: customer });
    } catch (error) {
      console.error('[GET_CUSTOMER]:', error);
      return ctx.json({ error: 'Failed to fetch customer' }, 500);
    }
  })

  /**
   * PATCH /api/customers/:id
   * Update customer profile
   */
  .patch('/:id', sessionMiddleware, zValidator('json', updateCustomerSchema), async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();
    const data = ctx.req.valid('json');

    // Only SUPER_ADMIN, ADMIN, and INVENTORY_MGR can update customers
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN && user.role !== UserRole.INVENTORY_MGR) {
      return ctx.json({ error: 'Unauthorized: Only admins can update customers' }, 403);
    }

    try {
      const customer = await updateCustomerProfile(id, data);

      return ctx.json({
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error) {
      console.error('[UPDATE_CUSTOMER]:', error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('phoneNumber')) {
            return ctx.json({ error: 'Phone number already exists' }, 400);
          }
          if (target.includes('email')) {
            return ctx.json({ error: 'Email already exists' }, 400);
          }
        }
      }

      if (error instanceof Error) {
        return ctx.json({ error: error.message }, 400);
      }

      return ctx.json({ error: 'Failed to update customer' }, 500);
    }
  })

  /**
   * DELETE /api/customers/:id
   * Delete customer
   */
  .delete('/:id', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    // Only SUPER_ADMIN and ADMIN can delete customers
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      return ctx.json({ error: 'Unauthorized: Only admins can delete customers' }, 403);
    }

    try {
      await deleteCustomer(id);
      return ctx.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('[DELETE_CUSTOMER]:', error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // ForeignKeyViolation
          return ctx.json({ error: 'Cannot delete customer with existing orders or records' }, 400);
        }
      }

      return ctx.json({ error: 'Failed to delete customer' }, 500);
    }
  });

export default app;
