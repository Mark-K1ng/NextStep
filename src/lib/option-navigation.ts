import { router as appRouter } from 'expo-router';
import type { ExploreItem } from '@/types/models';
export function openOption(router: typeof appRouter, item: ExploreItem) {
  const routes = {
    schools: '/school/[id]',
    school_profiles: '/specialization/[id]',
    universities: '/university/[id]',
    programs: '/program/[id]',
    careers: '/career/[id]',
    courses: '/course/[id]',
    skills: '/skill/[id]',
  } as const;
  const pathname = routes[item.type as keyof typeof routes];
  if (pathname) {
    router.push({ pathname, params: { id: item.id } });
  }
}
