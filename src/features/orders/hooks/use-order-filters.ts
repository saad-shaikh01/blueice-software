import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export const useOrderFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    date: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20),
  });
};
