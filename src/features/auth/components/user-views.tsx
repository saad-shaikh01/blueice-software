'use client';

import { Loader2 } from 'lucide-react';
import { useQueryState } from 'nuqs';

import { DottedSeparator } from '@/components/dotted-separator';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import { useGetUsers } from '../api/use-getUsers';
import { useUserFilters } from '../hooks/user-filters';
import { columns } from './columns';
import { DataSearch } from './data-search';
import { DataTable } from './data-table';

export const UserView = () => {
  const [view, setView] = useQueryState('task-view', {
    defaultValue: 'table',
  });
  const [{ search }] = useUserFilters();
  const { data: users, isLoading: isLoadingTasks } = useGetUsers({
    search,
  });

  return (
    <Tabs defaultValue={view} onValueChange={setView} className="w-full flex-1 rounded-lg border">
      <div className="flex h-full flex-col overflow-auto p-4">
        {/* <div className="flex flex-col items-center justify-between gap-y-2 lg:flex-row">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>

            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>

            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => open()} size="sm" className="w-full lg:w-auto">
            <PlusIcon className="size-4" />
            New
          </Button>
        </div> */}
        {/* <DottedSeparator className="my-4" /> */}

        <div className="flex flex-col justify-end gap-2 xl:flex-row xl:items-center">
          {/* <DataFilters hideProjectFilter={hideProjectFilter} /> */}

          <DataSearch />
        </div>

        <DottedSeparator className="my-4" />
        {isLoadingTasks ? (
          <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-lg border">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable columns={columns} data={users ?? []} />
            </TabsContent>

            {/* <TabsContent value="kanban" className="mt-0">
              <DataKanban data={tasks?.documents ?? []} onChange={onKanbanChange} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar data={tasks?.documents ?? []} />
            </TabsContent> */}
          </>
        )}
      </div>
    </Tabs>
  );
};
