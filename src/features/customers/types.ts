import { CustomerBottleWallet, CustomerProfile, Ledger, Order, Route, User } from '@prisma/client';

/**
 * Customer with user information
 */
export type CustomerWithUser = CustomerProfile & {
  user: Pick<User, 'id' | 'name' | 'email' | 'phoneNumber' | 'role' | 'isActive' | 'suspended'>;
  route?: Pick<Route, 'id' | 'name' | 'description'> | null;
};

/**
 * Customer with full order history for invoice context
 */
export type CustomerWithOrderHistory = CustomerProfile & {
  user: Pick<User, 'id' | 'name' | 'email' | 'phoneNumber' | 'role' | 'isActive' | 'suspended'>;
  route?: Pick<Route, 'id' | 'name' | 'description'> | null;
  orders: Order[];
  bottleWallets: CustomerBottleWallet[];
  ledgers: Ledger[];
};
