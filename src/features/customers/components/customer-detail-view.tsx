'use client';

import { useRouter } from 'next/navigation';
import { Pencil, Trash, ArrowLeft, Phone, MapPin, Route as RouteIcon, Wallet, CreditCard, Package } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';
import { useGetCustomer } from '@/features/customers/api/use-get-customer';
import { useDeleteCustomer } from '@/features/customers/api/use-delete-customer';
import { useConfirm } from '@/hooks/use-confirm';

interface CustomerDetailViewProps {
  customerId: string;
}

export const CustomerDetailView = ({ customerId }: CustomerDetailViewProps) => {
  const router = useRouter();
  const { data: customer, isLoading } = useGetCustomer(customerId);
  const { mutate: deleteCustomer, isPending: isDeleting } = useDeleteCustomer();

  const [ConfirmDialog, confirm] = useConfirm(
    'Delete Customer',
    'Are you sure you want to delete this customer? This will remove all their data.',
    'destructive'
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteCustomer({ param: { id: customerId } }, {
        onSuccess: () => router.push('/customers')
      });
    }
  };

  if (isLoading) return <PageLoader />;
  if (!customer) return <PageError message="Customer not found" />;

  const cashBalance = Number(customer.cashBalance);
  const creditLimit = Number(customer.creditLimit);

  return (
    <div className="space-y-6">
      <ConfirmDialog />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/customers')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{customer.user.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.manualCode || 'No Code'}</p>
          </div>
          <Badge variant={customer.user.isActive ? 'default' : 'secondary'}>
            {customer.user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/customers/${customerId}/edit`)}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Phone className="size-4" />
              Contact & Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-base">{customer.user.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{customer.user.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-base">{customer.address}</p>
              <p className="text-sm text-muted-foreground">{customer.area} {customer.landmark && `(${customer.landmark})`}</p>
            </div>
            {customer.route && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Route</p>
                <div className="flex items-center gap-2">
                  <RouteIcon className="size-4 text-muted-foreground" />
                  <span>{customer.route.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wallet className="size-4" />
              Financial Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className={`text-3xl font-bold ${cashBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(cashBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {cashBalance < 0 ? 'Customer owes you' : 'Advance payment'}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credit Limit</p>
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <span>{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(creditLimit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottle Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="size-4" />
              Bottle Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.bottleWallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bottles held.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 py-2">Product</TableHead>
                    <TableHead className="h-8 py-2 text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.bottleWallets.map((wallet: any) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="py-2 font-medium">{wallet.product.name}</TableCell>
                      <TableCell className="py-2 text-right">{wallet.balance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ledger History */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.ledgers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.ledgers.map((ledger: any) => (
                    <TableRow key={ledger.id}>
                      <TableCell className="text-xs">{format(new Date(ledger.createdAt), 'dd/MM/yy')}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate" title={ledger.description}>{ledger.description}</TableCell>
                      <TableCell className={`text-right text-xs font-medium ${Number(ledger.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(ledger.amount) < 0 ? '' : '+'}{Number(ledger.amount)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {new Intl.NumberFormat('en-PK').format(Number(ledger.balanceAfter))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order: any) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/orders/${order.id}/invoice`)}>
                      <TableCell className="font-medium">#{order.readableId}</TableCell>
                      <TableCell className="text-xs">{format(new Date(order.scheduledDate), 'dd/MM/yy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] h-5">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {new Intl.NumberFormat('en-PK').format(Number(order.totalAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
