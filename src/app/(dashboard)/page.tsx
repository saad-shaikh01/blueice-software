import { redirect } from 'next/navigation';

import { getCurrent } from '@/features/auth/queries';

const HomePage = async () => {
  const user = await getCurrent();

  if (!user) redirect('/sign-in');

  redirect(`/dashboard`);
};

export default HomePage;