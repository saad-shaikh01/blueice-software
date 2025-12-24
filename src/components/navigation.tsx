'use client';

import { Settings, Users, Package, Truck, Map, ShoppingCart, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const routes = [
  {
    label: 'Dashboard',
    href: '',
    icon: LayoutDashboard,
    activeIcon: LayoutDashboard,
  },
  {
    label: 'Customers',
    href: 'customers',
    icon: Users,
    activeIcon: Users,
  },
  {
    label: 'Orders',
    href: 'orders',
    icon: ShoppingCart,
    activeIcon: ShoppingCart,
  },
  {
    label: 'Products',
    href: 'products',
    icon: Package,
    activeIcon: Package,
  },
  {
    label: 'Drivers',
    href: 'drivers',
    icon: Truck,
    activeIcon: Truck,
  },
  {
    label: 'Routes',
    href: 'routes',
    icon: Map,
    activeIcon: Map,
  },
];

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col">
      {routes.map((route) => {
        const fullHref = `/${route.href}`;
        const isActive = pathname === fullHref;
        const Icon = isActive ? route.activeIcon : route.icon;

        return (
          <li key={fullHref}>
            <Link
              href={fullHref}
              className={cn(
                'flex items-center gap-2.5 rounded-md p-2.5 font-medium text-muted-foreground transition hover:text-primary',
                isActive && 'bg-background text-primary shadow-sm hover:opacity-100',
              )}
            >
              <Icon className="size-5 text-muted-foreground" />
              {route.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
