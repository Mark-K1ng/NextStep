import type { ExploreItem } from '@/types/models';
export function selectComparison(
  current: ExploreItem[],
  item: ExploreItem
): ExploreItem[] {
  if (
    !current[0] ||
    current[0].type !== item.type ||
    current[0].id === item.id
  ) {
    return current;
  }
  return [current[0], item];
}
