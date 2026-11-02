import type { PropsWithChildren } from 'react';

// iOS keeps its native tab controller; web keeps its existing navigation.
export function NavigationFrame({ children }: PropsWithChildren) {
  return children;
}
