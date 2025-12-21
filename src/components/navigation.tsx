'use client';

import { MessageCircleDashedIcon, Settings, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GoCheckCircle, GoCheckCircleFill, GoHome, GoHomeFill, GoProjectRoadmap, GoProjectTemplate } from 'react-icons/go';
import { cn } from '@/lib/utils';

const routes = [
  {
    label: 'Home',
    href: '',
    icon: GoHome,
    activeIcon: GoHomeFill,
  },

  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    activeIcon: Settings,
  },

  {
    label: 'Users',
    href: '/users',
    icon: UsersIcon,
    activeIcon: UsersIcon,
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
