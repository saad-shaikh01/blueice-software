import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';
import { ForgotPassCard } from '@/features/auth/components/forgot-pass-card';

const ForgotPassPage = async () => {
  const user = await getCurrent();

  if (user) redirect('/');

  return <ForgotPassCard />;
};

export default ForgotPassPage;
