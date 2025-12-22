'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Pencil, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useDeleteProduct } from '../api/use-delete-product';
import { useConfirm } from '@/hooks/use-confirm';

export type Product = {
  id: string;
  name: string;
  sku: string;
  basePrice: string;
  isReturnable: boolean;
  stockFilled: number;
  stockEmpty: number;
};

const ActionCell = ({ product }: { product: Product }) => {
  const router = useRouter();
  const { mutate: deleteProduct, isPending } = useDeleteProduct();
  const [ConfirmDialog, confirm] = useConfirm(
    'Delete Product',
    'Are you sure you want to delete this product? This action cannot be undone.',
    'destructive'
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteProduct({ param: { id: product.id } });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/products/${product.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('sku')}</div>,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'basePrice',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('basePrice'));
      const formatted = new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
      }).format(price);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'isReturnable',
    header: 'Type',
    cell: ({ row }) => {
      const isReturnable = row.getValue('isReturnable') as boolean;
      return (
        <Badge variant={isReturnable ? 'default' : 'secondary'}>
          {isReturnable ? 'Returnable' : 'One-time'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'stockFilled',
    header: 'Stock (Filled)',
  },
  {
    accessorKey: 'stockEmpty',
    header: 'Stock (Empty)',
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionCell product={row.original} />,
  },
];
