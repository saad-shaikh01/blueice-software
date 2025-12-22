import { EditCustomerForm } from '@/features/customers/components/edit-customer-form';

interface EditCustomerPageProps {
  params: {
    customerId: string;
  };
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  return <EditCustomerForm customerId={params.customerId} />;
}
