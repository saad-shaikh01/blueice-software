import { DriverForm } from '@/features/drivers/components/driver-form';

interface EditDriverPageProps {
  params: {
    driverId: string;
  };
}

export default function EditDriverPage({ params }: EditDriverPageProps) {
  return <DriverForm driverId={params.driverId} />;
}
