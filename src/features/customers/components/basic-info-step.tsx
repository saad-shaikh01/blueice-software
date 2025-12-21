'use client';

import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateCustomerInput } from '@/features/customers/schema';

export const BasicInfoStep = () => {
  const form = useFormContext<CreateCustomerInput>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Enter the basic details of the new customer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmed Khan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="03001234567" {...field} />
                  </FormControl>
                  <FormDescription>Primary contact number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ahmed@example.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Minimum 8 characters" {...field} />
                </FormControl>
                <FormDescription>Customer login password</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="size-5" />
            Legacy Customer Code
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Only for migrating existing customers from old system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="manualCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manual Code (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="L-3442"
                    {...field}
                    value={field.value || ''}
                    className="font-mono"
                  />
                </FormControl>
                <FormDescription>
                  Format: L-XXXX (e.g., L-3442). Leave empty for new customers.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
