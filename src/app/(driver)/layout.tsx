'use client';

import Link from 'next/link';
import { useLogout } from '@/features/auth/api/use-logout';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface DriverLayoutProps {
  children: React.ReactNode;
}

export default function DriverLayout({ children }: DriverLayoutProps) {
  const { mutate: logout } = useLogout();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white p-4 shadow-sm dark:bg-neutral-950">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/deliveries">
            <h1 className="text-xl font-bold text-blue-600">Blue Ice Driver</h1>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-md p-4 pb-20">
        {children}
      </main>
    </div>
  );
}
