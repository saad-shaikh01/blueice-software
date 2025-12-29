'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

import { useCreateProduct } from '../api/use-create-product';
import { useGetProduct } from '../api/use-get-product';
import { useUpdateProduct } from '../api/use-update-product';
import { type CreateProductInput, createProductSchema } from '../schema';

interface ProductFormProps {
  productId?: string;
  onCancel?: () => void;
}

export const ProductForm = ({ productId, onCancel }: ProductFormProps) => {
  const router = useRouter();
  const isEdit = !!productId;

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(productId || '');
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const isPending = isCreating || isUpdating;

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      basePrice: 0,
      isReturnable: true,
      stockFilled: 0,
      stockEmpty: 0,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        basePrice: Number(product.basePrice),
        isReturnable: product.isReturnable,
        stockFilled: product.stockFilled,
        stockEmpty: product.stockEmpty,
      });
    }
  }, [product, form]);

  const onSubmit = (data: CreateProductInput) => {
    if (isEdit && productId) {
      updateProduct(
        { param: { id: productId }, json: data },
        {
          onSuccess: () => router.push('/products'),
        },
      );
    } else {
      createProduct(data, {
        onSuccess: () => router.push('/products'),
      });
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.push('/products');
  };

  if (isEdit && isLoadingProduct) return <PageLoader />;
  if (isEdit && !product) return <PageError message="Product not found" />;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Product' : 'Create New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 19L Mineral Water" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MW-19L" {...field} />
                    </FormControl>
                    <FormDescription>Unique Stock Keeping Unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (PKR)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isReturnable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Returnable Item</FormLabel>
                    <FormDescription>
                      Check this if the bottle/container is returned by customer (e.g. 19L Bottle). Uncheck for one-time items (e.g.
                      Disposable cups).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockFilled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock (Filled)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stockEmpty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Stock (Empty)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
