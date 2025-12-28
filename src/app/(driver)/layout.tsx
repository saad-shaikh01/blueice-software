import { UserButton } from '@/features/auth/components/user-button';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { OfflineIndicator } from '@/components/offline-indicator';
import Image from 'next/image';
import Link from 'next/link';

interface DriverLayoutProps {
  children: React.ReactNode;
}

export default function DriverLayout({ children }: DriverLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <ServiceWorkerRegister />
      <OfflineIndicator />

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/deliveries" className="flex items-center gap-2 font-semibold">
              <Image src="/icon1.png" alt="Logo" width={24} height={24} />
              <span>Driver App</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <UserButton />
          </div>
        </div>
      </header>
      <main className="container px-4 py-6 pb-20 max-w-md mx-auto">{children}</main>
    </div>
  );
}
