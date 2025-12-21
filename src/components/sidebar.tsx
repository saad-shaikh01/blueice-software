import { Suspense } from 'react';
import { DottedSeparator } from './dotted-separator';
import { Logo } from './logo';
import { Navigation } from './navigation';

export const Sidebar = () => {

  return (
    <aside className="size-full bg-muted/40 p-4 border-r border-border">
      <Logo />

      <DottedSeparator className="my-4" />

      <Navigation />

      <DottedSeparator className="my-4" />

    </aside>
  );
};
