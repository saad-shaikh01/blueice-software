import { parseAsString, useQueryState } from 'nuqs';

export const useUserDetailModal = () => {
  const [userId, setUserId] = useQueryState('user-detail', parseAsString);

  const open = (id: string) => setUserId(id);
  const close = () => setUserId(null);

  return {
    userId,
    setUserId,
    open,
    close,
  };
};
