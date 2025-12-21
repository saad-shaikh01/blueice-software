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
        [Status.TODO]: 'border-transparent bg-red-400 text-red-50 hover:bg-red-400/80',
        [Status.ON_HOLD]: 'border-transparent bg-sky-400 text-yellow-50 hover:bg-yellow-400/80',
        [Status.IN_PROGRESS]: 'border-transparent bg-lime-400 text-yellow-50 hover:bg-yellow-400/80',
        [Status.NEXT_IN_QUEUE]: 'border-transparent bg-yellow-400 text-yellow-50 hover:bg-yellow-400/80',
        [Status.PM]: 'border-transparent bg-purple-400 text-yellow-50 hover:bg-yellow-400/80',
        [Status.PROD]: 'border-transparent bg-cyan-400 text-yellow-50 hover:bg-yellow-400/80',
        [Status.IN_REVIEW]: 'border-transparent bg-blue-400 text-blue-50 hover:bg-blue-400/80',
        [Status.DONE]: 'border-transparent bg-emerald-400 text-emerald-50 hover:bg-emerald-400/80',
        [Status.BACKLOG]: 'border-transparent bg-pink-400 text-pink-50 hover:bg-pink-400/80',
        [LeadStatus.NEW]: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        [LeadStatus.CONTACTED]: 'border-transparent bg-blue-400 text-[#fff]',
        [LeadStatus.IN_DISCUSSION]: 'border-transparent bg-yellow-400 text-yellow-50 hover:bg-yellow-400/80',
        [LeadStatus.CONVERTED]: 'border-transparent bg-emerald-400 text-emerald-50 hover:bg-emerald-400/80',
        [LeadStatus.LOST]: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        [LeadStatus.QUALIFIED]: 'border-transparent bg-pink-400 text-pink-50 hover:bg-pink-400/80',
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
