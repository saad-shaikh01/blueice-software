import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useConfirm } from '@/hooks/use-confirm';

import { useUpdateStatus } from '../api/use-update-status';

interface UserActionsProps {
  id: string;
  suspended: boolean;
}

export const UserActions = ({ id, suspended, children }: PropsWithChildren<UserActionsProps>) => {
  const router = useRouter();

  const [ConfirmDialog, confirm] = useConfirm(
    suspended ? 'Activate User' : 'Suspend User',
    suspended ? 'This will activate the user.' : 'This action will suspend the user and cannot be undone.',
    'destructive',
  );
  const { mutate: updateStatus, isPending } = useUpdateStatus();

  const onUpdate = async () => {
    const ok = await confirm();
    if (!ok) return;

    updateStatus({ param: { userId: id }, json: { suspended: !suspended } });
  };

  return (
    <div className="flex justify-end">
      <ConfirmDialog />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={isPending}>
          {children}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onUpdate} disabled={isPending} className="p-[10px] font-medium text-amber-700 focus:text-amber-700">
            <Trash className="mr-2 size-4 stroke-2" />
            {suspended ? 'Activate User' : 'Suspend User'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
