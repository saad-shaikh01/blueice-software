import { CompleteDeliveryForm } from '@/features/driver-view/components/complete-delivery-form';

interface DriverOrderPageProps {
  params: {
    orderId: string;
  };
}

export default function DriverOrderPage({ params }: DriverOrderPageProps) {
  return <CompleteDeliveryForm orderId={params.orderId} />;
}
