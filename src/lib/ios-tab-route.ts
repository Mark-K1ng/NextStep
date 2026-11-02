import type { Href } from 'expo-router';
import type { JourneyTab } from '@/providers/journey';

const tabPages = new Set([
  'tutoring',
  'explore',
  'school',
  'specialization',
  'university',
  'program',
  'career',
  'course',
  'skill',
  'saved',
  'compare',
  'objective',
  'recommendations',
  'settings',
  'palette',
  'privacy-and-data',
  'qa',
  'data-export',
  'delete-account',
  'privacy',
  'terms',
]);

/** Keep iPhone pushes inside the originating native tab's stack. */
export function iosTabRoute(href: Href, origin: JourneyTab | null): Href {
  const pathname = typeof href === 'string' ? href : href.pathname;
  const peer = pathname.match(
    /^\/_tabs\/(home|tutoring|explore|path|profile)(?:\/index)?(?=[?#]|$)/
  );
  let next: string;
  if (peer) {
    next = pathname.replace(peer[0], `/_tabs/(${peer[1]})`);
  } else {
    const page = pathname.split('/')[1]?.split(/[?#]/)[0];
    if (
      !tabPages.has(page) ||
      (!origin && (page === 'privacy' || page === 'terms'))
    ) {
      return href;
    }
    next = `/_tabs/(${page === 'tutoring' ? 'tutoring' : origin || 'home'})${pathname}`;
  }
  return (
    typeof href === 'string' ? next : { ...href, pathname: next }
  ) as Href;
}
