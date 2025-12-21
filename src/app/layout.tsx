import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { PropsWithChildren } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { siteConfig } from '@/config';
import { cn } from '@/lib/utils';

import './globals.css';
import { Providers } from './providers';
import FcmTokenComp from '@/components/firebase-forground';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = siteConfig;

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'min-h-screen antialiased')}>
        <Providers>
          <Toaster theme="light" richColors closeButton />
          <FcmTokenComp />
          {children}
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
