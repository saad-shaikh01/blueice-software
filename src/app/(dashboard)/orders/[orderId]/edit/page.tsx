import { OrderForm } from '@/features/orders/components/order-form';

interface EditOrderPageProps {
  params: {
    orderId: string;
  };
}

export default function EditOrderPage({ params }: EditOrderPageProps) {
  return <OrderForm orderId={params.orderId} />;
}
