import { zValidator } from '@hono/zod-validator';
import { Prisma, UserRole } from '@prisma/client';
import { Hono } from 'hono';

import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from '@/features/products/queries';
import { createProductSchema, getProductsQuerySchema, updateProductSchema } from '@/features/products/schema';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', getProductsQuerySchema), async (ctx) => {
    const { search } = ctx.req.valid('query');

    try {
      const products = await getProducts(search);
      return ctx.json({ data: products });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch products' }, 500);
    }
  })
  .get('/:id', sessionMiddleware, async (ctx) => {
    const { id } = ctx.req.param();

    try {
      const product = await getProduct(id);
      if (!product) return ctx.json({ error: 'Product not found' }, 404);
      return ctx.json({ data: product });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch product' }, 500);
    }
  })
  .post('/', sessionMiddleware, zValidator('json', createProductSchema), async (ctx) => {
    const user = ctx.get('user');

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const product = await createProduct(data);
      return ctx.json({ data: product });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return ctx.json({ error: 'Product SKU already exists' }, 400);
      }
      return ctx.json({ error: 'Failed to create product' }, 500);
    }
  })
  .patch('/:id', sessionMiddleware, zValidator('json', updateProductSchema), async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const product = await updateProduct(id, data);
      return ctx.json({ data: product });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return ctx.json({ error: 'Product SKU already exists' }, 400);
      }
      return ctx.json({ error: 'Failed to update product' }, 500);
    }
  })
  .delete('/:id', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      await deleteProduct(id);
      return ctx.json({ success: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return ctx.json({ error: 'Cannot delete product used in orders or wallets' }, 400);
      }
      return ctx.json({ error: 'Failed to delete product' }, 500);
    }
  });

export default app;
