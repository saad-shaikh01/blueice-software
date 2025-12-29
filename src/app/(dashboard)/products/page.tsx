'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { useGetProducts } from '@/features/products/api/use-get-products';
import { Product, columns } from '@/features/products/components/columns';
import { ProductTable } from '@/features/products/components/product-list';

function ProductsContent() {
  const { data, isLoading } = useGetProducts();
  const products: Product[] = (data as unknown as Product[]) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>
      <ProductTable columns={columns} data={products} isLoading={isLoading} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
