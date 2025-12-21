'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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

// Define the shape of your data based on the API response
// This should match the return type of getCustomers in queries.ts
export type Customer = {
  id: string;
  userId: string;
  manualCode: string | null;
  area: string;
  address: string;
  type: string;
  creditLimit: string;
  cashBalance: string;
  user: {
    name: string;
    email: string | null;
    phoneNumber: string;
    isActive: boolean;
    suspended: boolean;
  };
  route: {
    name: string;
  } | null;
};

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'manualCode',
    header: 'Code',
    cell: ({ row }) => <div className="font-medium">{row.getValue('manualCode') || '-'}</div>,
  },
  {
    accessorKey: 'user.name',
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
    cell: ({ row }) => <div className="pl-4">{row.original.user.name}</div>,
  },
  {
    accessorKey: 'user.phoneNumber',
    header: 'Phone',
  },
  {
    accessorKey: 'area',
    header: 'Area',
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => <div className="truncate max-w-[200px]" title={row.getValue('address')}>{row.getValue('address')}</div>,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
       const type = row.getValue('type') as string;
       return <Badge variant="secondary">{type}</Badge>
    }
  },
  {
      accessorKey: 'route.name',
      header: 'Route',
      cell: ({ row }) => row.original.route?.name || '-',
  },
  {
    accessorKey: 'cashBalance',
    header: 'Balance',
     cell: ({ row }) => {
      const balance = parseFloat(row.getValue('cashBalance'));
      const formatted = new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
      }).format(balance);

      return <div className={balance < 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>{formatted}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(customer.id)}
            >
              Copy customer ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit customer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
