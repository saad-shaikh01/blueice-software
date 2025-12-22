import { parseAsString, useQueryStates } from 'nuqs';

export const useProductFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault(''),
  });
};
