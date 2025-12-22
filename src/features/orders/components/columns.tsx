'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Pencil, Trash, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useDeleteOrder } from '../api/use-delete-order';
import { useConfirm } from '@/hooks/use-confirm';

export type Order = {
  id: string;
  readableId: number;
  scheduledDate: string;
  status: OrderStatus;
  totalAmount: string;
  customer: {
    user: { name: string; phoneNumber: string };
  };
  driver?: {
    user: { name: string };
  } | null;
};

const ActionCell = ({ order }: { order: Order }) => {
  const router = useRouter();
  const { mutate: deleteOrder, isPending } = useDeleteOrder();
  const [ConfirmDialog, confirm] = useConfirm(
    'Delete Order',
    `Are you sure you want to delete order #${order.readableId}?`,
    'destructive'
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteOrder({ param: { id: order.id } });
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
          <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Order
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'readableId',
    header: 'Order #',
    cell: ({ row }) => <div className="font-mono font-medium">#{row.getValue('readableId')}</div>,
  },
  {
    accessorKey: 'scheduledDate',
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    cell: ({ row }) => <div>{format(new Date(row.getValue('scheduledDate')), 'PPP')}</div>,
  },
  {
    accessorKey: 'customer.user.name',
    header: 'Customer',
  },
  {
    accessorKey: 'driver.user.name',
    header: 'Driver',
    cell: ({ row }) => row.original.driver?.user.name || '-',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as OrderStatus;
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";

      switch (status) {
        case 'COMPLETED': variant = "default"; break; // Greenish usually default/success
        case 'CANCELLED': variant = "destructive"; break;
        case 'PENDING': variant = "secondary"; break;
        case 'SCHEDULED': variant = "outline"; break;
        default: variant = "secondary";
      }

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalAmount'));
      return <div>{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount)}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionCell order={row.original} />,
  },
];
