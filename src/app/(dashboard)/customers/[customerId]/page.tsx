import { CustomerDetailView } from '@/features/customers/components/customer-detail-view';

interface CustomerDetailPageProps {
  params: {
    customerId: string;
  };
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  return <CustomerDetailView customerId={params.customerId} />;
}
