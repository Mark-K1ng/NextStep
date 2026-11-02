import { useMemo } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useJourney, type JourneyTab } from '@/providers/journey';
import { iosTabRoute } from '@/lib/ios-tab-route';
import { useAccountMode } from '@/providers/account-mode';

export function useAppRouter(): ReturnType<typeof useRouter> {
  const router = useRouter();
  const segments = useSegments();
  const journey = useJourney();
  const { isTeacher, isPreview } = useAccountMode();
  const teacherView = isTeacher && !isPreview;
  const group = segments.find((segment) =>
    /^\((home|tutoring|explore|path|profile)\)$/.test(segment)
  );
  const origin = group ? (group.slice(1, -1) as JourneyTab) : journey.activeTab;
  return useMemo(
    () => ({
      ...router,
      push: (href, options) =>
        router.push(teacherView ? href : iosTabRoute(href, origin), options),
      navigate: (href, options) =>
        router.navigate(
          teacherView ? href : iosTabRoute(href, origin),
          options
        ),
      replace: (href, options) =>
        router.replace(teacherView ? href : iosTabRoute(href, origin), options),
      dismissTo: (href, options) =>
        router.dismissTo(
          teacherView ? href : iosTabRoute(href, origin),
          options
        ),
    }),
    [router, origin, teacherView]
  );
}
