import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

export const useRouteFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20),
  });
};
