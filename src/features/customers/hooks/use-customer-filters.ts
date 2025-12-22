import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export const useCustomerFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20),
  });
};
