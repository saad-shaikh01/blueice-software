import { useParams } from 'next/navigation';

export const useResetPassToken = () => {
  const params = useParams();

  return params.resetToken as string;
};
