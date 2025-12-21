import { parseAsString, useQueryStates } from 'nuqs';

export const useUserFilters = () => {
  return useQueryStates({
    search: parseAsString,
  });
};
