import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

import { getCurrent } from '@/features/auth/queries';
import { ComprehensiveDashboard } from '@/features/dashboard/components/comprehensive-dashboard';

const HomePage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  if (user.role === UserRole.DRIVER) {
    redirect('/deliveries');
  }

  return <ComprehensiveDashboard />;
};

export default HomePage;
