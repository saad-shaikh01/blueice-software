'use client';

import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { useCurrent } from '@/features/auth/api/use-current';
import { EditProfileForm } from '@/features/auth/components/edit-profile-form';

export const ProfileSettingsClient = () => {
  const { data: user, isLoading } = useCurrent();

  if (isLoading) return <PageLoader />;
  if (!user) return <PageError message="Project not found." />;

  return (
    <div className="w-full lg:max-w-xl">
      <EditProfileForm initialValues={user} />
    </div>
  );
};
