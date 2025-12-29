import { redirect } from 'next/navigation';

import { ForgotPassCard } from '@/features/auth/components/forgot-pass-card';
import { getCurrent } from '@/features/auth/queries';

const ForgotPassPage = async () => {
  const user = await getCurrent();

  if (user) redirect('/');

  return <ForgotPassCard />;
};

export default ForgotPassPage;
