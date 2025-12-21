import { Ubuntu } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

const font = Ubuntu({
  weight: ['700'],
  subsets: ['latin'],
});

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-x-1.5">
      <Image src="/apple-touch-icon.png" alt="Icon" height={40} width={40} />
      <p className={cn('text-xl font-semibold text-foreground', font.className)}>MADCOM DIGITAL</p>
    </Link>
  );
};
