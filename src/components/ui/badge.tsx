import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { LeadStatus, Status } from '@prisma/client';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        [Status.TODO]: 'border-transparent bg-red-500 text-white hover:bg-red-600 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800',
        [Status.ON_HOLD]: 'border-transparent bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-900 dark:text-sky-100 dark:hover:bg-sky-800',
        [Status.IN_PROGRESS]: 'border-transparent bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-900 dark:text-lime-100 dark:hover:bg-lime-800',
        [Status.NEXT_IN_QUEUE]: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800',
        [Status.PM]: 'border-transparent bg-purple-500 text-white hover:bg-purple-600 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800',
        [Status.PROD]: 'border-transparent bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-cyan-900 dark:text-cyan-100 dark:hover:bg-cyan-800',
        [Status.IN_REVIEW]: 'border-transparent bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800',
        [Status.DONE]: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800',
        [Status.BACKLOG]: 'border-transparent bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-900 dark:text-pink-100 dark:hover:bg-pink-800',
        [LeadStatus.NEW]: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        [LeadStatus.CONTACTED]: 'border-transparent bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800',
        [LeadStatus.IN_DISCUSSION]: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800',
        [LeadStatus.CONVERTED]: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800',
        [LeadStatus.LOST]: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        [LeadStatus.QUALIFIED]: 'border-transparent bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-900 dark:text-pink-100 dark:hover:bg-pink-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
