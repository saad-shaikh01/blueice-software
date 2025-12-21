import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';
import { ResetPassCard } from '@/features/auth/components/reset-pass-card';

const ResetPassPage = async () => {
  const user = await getCurrent();

  if (user) redirect('/');

  return <ResetPassCard />;
};

export default ResetPassPage;
