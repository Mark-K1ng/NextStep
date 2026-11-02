import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { usePathname, useSegments } from 'expo-router';
import type { ExploreItem } from '@/types/models';
import { useSession } from '@/providers/auth';
import { selectComparison as chooseComparison } from '@/lib/comparison';
import { useAccountMode } from './account-mode';

export type JourneyTab = 'home' | 'tutoring' | 'explore' | 'path' | 'profile';
type Journey = {
  activeTab: JourneyTab | null;
  barHeight: number;
  setBarHeight(height: number): void;
  comparison: ExploreItem[];
  beginComparison(item: ExploreItem): void;
  selectComparison(item: ExploreItem): void;
  resetSecond(): void;
};
const Context = createContext<Journey>({
  activeTab: null,
  barHeight: 88,
  setBarHeight() {},
  comparison: [],
  beginComparison() {},
  selectComparison() {},
  resetSecond() {},
});
export function JourneyProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const segments = useSegments();
  const nativeGroup = segments.find((segment) =>
    /^\((home|tutoring|explore|path|profile)\)$/.test(segment)
  );
  const { session } = useSession();
  const { isPreview } = useAccountMode();
  const [activeTab, setActiveTab] = useState<JourneyTab | null>(null);
  const [comparison, setComparison] = useState<ExploreItem[]>([]);
  const [barHeight, setBarHeight] = useState(88);
  useEffect(() => {
    setComparison([]);
    setActiveTab(null);
  }, [session?.user.id, isPreview]);
  useEffect(() => {
    const match = pathname.match(
      /\/_tabs\/(home|tutoring|explore|path|profile)(?:\/|$)/
    );
    if (nativeGroup) {
      setActiveTab(nativeGroup.slice(1, -1) as JourneyTab);
    } else if (pathname.startsWith('/tutoring/')) {
      setActiveTab('tutoring');
    } else if (match) {
      setActiveTab(match[1] as JourneyTab);
    }
  }, [pathname, nativeGroup, session?.user.id]);
  return (
    <Context.Provider
      value={{
        activeTab,
        comparison,
        barHeight,
        setBarHeight,
        beginComparison: (item) => setComparison([item]),
        selectComparison: (item) =>
          setComparison((current) => chooseComparison(current, item)),
        resetSecond: () => setComparison((current) => current.slice(0, 1)),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useJourney = () => useContext(Context);
