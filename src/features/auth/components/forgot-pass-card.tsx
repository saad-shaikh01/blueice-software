'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema } from '../schema';
import { useForgot } from '../api/use-forgot';

export const ForgotPassCard = () => {
  const { mutate: forgot, isPending } = useForgot();
  const forgotForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    forgot(
      {
        json: values,
      },
      {
        onSuccess: () => {
          forgotForm.reset();
        },
        // onError: () => {
        //   forgotForm.resetField('password');
        // },
      },
    );
  };
  return (
    <Card className="size-full border-none shadow-none md:w-[487px]">
      <CardHeader className="flex items-center justify-center p-7 text-center">
        <CardTitle className="text-2xl">Enter Your Email Address</CardTitle>
      </CardHeader>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        <Form {...forgotForm}>
          <form onSubmit={forgotForm.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              disabled={isPending}
              name="email"
              control={forgotForm.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Email address" />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} size="lg" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="flex items-center justify-center p-7">
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up">
            <span className="text-blue-700 dark:text-blue-500">Register</span>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};
