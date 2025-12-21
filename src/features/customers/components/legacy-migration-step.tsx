'use client';

import { useFormContext } from 'react-hook-form';
import { Database, AlertTriangle, Package } from 'lucide-react';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateCustomerInput } from '@/features/customers/schema';
import { useGetProducts } from '@/features/customers/api/use-get-products';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const LegacyMigrationStep = () => {
  const form = useFormContext<CreateCustomerInput>();
  const { data: products, isLoading } = useGetProducts();

  const openingCashBalance = form.watch('openingCashBalance');
  const openingBottleBalance = form.watch('openingBottleBalance');

  const hasMigrationData =
    (openingCashBalance && parseFloat(openingCashBalance) > 0) ||
    (openingBottleBalance && openingBottleBalance > 0);

  return (
    <div className="space-y-6">
      <Alert className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/20">
        <Database className="size-4 text-purple-600 dark:text-purple-400" />
        <AlertTitle className="text-purple-900 dark:text-purple-100">Legacy Data Migration</AlertTitle>
        <AlertDescription className="text-purple-700 dark:text-purple-300">
          This section is <strong>only for migrating existing customers</strong> from your old system. If this is a
          brand new customer, leave all fields at zero and click Submit.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Opening Cash Balance
          </CardTitle>
          <CardDescription>Carry forward existing advance or debt from legacy system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="openingCashBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opening Cash Balance (PKR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    className="font-mono text-lg"
                  />
                </FormControl>
                <FormDescription>
                  Enter <strong>positive</strong> for advance payment, <strong>negative</strong> for debt (udhaar)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {openingCashBalance && parseFloat(openingCashBalance) > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✅ Customer has advance: PKR {parseFloat(openingCashBalance).toLocaleString()}
              </p>
            </div>
          )}

          {openingCashBalance && parseFloat(openingCashBalance) < 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                ⚠️ Customer owes: PKR {Math.abs(parseFloat(openingCashBalance)).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Opening Bottle Balance
          </CardTitle>
          <CardDescription>Number of bottles customer is currently holding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="openingBottleBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Bottles</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="font-mono text-lg"
                    />
                  </FormControl>
                  <FormDescription>Bottles held by customer</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Type {openingBottleBalance > 0 && '*'}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                    disabled={!openingBottleBalance || openingBottleBalance === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading && (
                        <SelectItem value="loading" disabled>
                          Loading products...
                        </SelectItem>
                      )}
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {openingBottleBalance > 0 ? 'Required when bottle balance > 0' : 'Not needed if no bottles'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {openingBottleBalance > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                📦 Customer holds: {openingBottleBalance} bottle{openingBottleBalance !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {hasMigrationData && (
        <Alert variant="default" className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
          <AlertTriangle className="size-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">Migration Transaction</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            When you submit, the system will:
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {openingCashBalance && parseFloat(openingCashBalance) !== 0 && (
                <li>Create a Ledger entry: "Opening Balance Migration"</li>
              )}
              {openingBottleBalance > 0 && <li>Create a Bottle Wallet entry for inventory tracking</li>}
              <li>Link all data in a single atomic transaction</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!hasMigrationData && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-900/20">
          <p className="text-sm text-muted-foreground">
            No migration data entered. This will create a new customer with zero opening balances. ✨
          </p>
        </div>
      )}
    </div>
  );
};
