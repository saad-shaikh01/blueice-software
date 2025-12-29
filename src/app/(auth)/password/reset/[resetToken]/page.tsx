import { redirect } from 'next/navigation';

import { ResetPassCard } from '@/features/auth/components/reset-pass-card';
import { getCurrent } from '@/features/auth/queries';

const ResetPassPage = async () => {
  const user = await getCurrent();

  if (user) redirect('/');

  return <ResetPassCard />;
};

export default ResetPassPage;
