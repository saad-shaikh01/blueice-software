import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';
import { ComprehensiveDashboard } from '@/features/dashboard/components/comprehensive-dashboard';
import { InventoryDashboard } from '@/features/dashboard/components/inventory-dashboard';

const HomePage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  if (user.role === UserRole.DRIVER) {
    redirect('/deliveries');
  }

  if (user.role === UserRole.INVENTORY_MGR) {
    return <InventoryDashboard />;
  }

  return <ComprehensiveDashboard />;
};

export default HomePage;
