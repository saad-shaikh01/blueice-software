import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

import { getCurrent } from '@/features/auth/queries';
import { DashboardStats } from '@/features/dashboard/components/dashboard-stats';

const HomePage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  if (user.role === UserRole.DRIVER) {
    redirect('/deliveries');
  }

  return (
    <div className="flex flex-col gap-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <DashboardStats />
    </div>
  );
};

export default HomePage;
