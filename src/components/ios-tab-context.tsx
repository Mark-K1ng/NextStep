import { createContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export const IosTabSegmentContext = createContext('(home)');
export const IosAppearingTabContext = createContext<string | null>(null);

type RevealStarter = {
  start(): void;
  prepare(): void;
  prepared: boolean;
  progress?: SharedValue<number>;
};
export type IosTabTouchControl = {
  targets: SharedValue<SharedValue<number>[]>;
};
let touchControl: IosTabTouchControl | null = null;
const revealStarters = new Map<string, RevealStarter>();
let appearingTab: string | null = null;
function publishTargets() {
  const progress = appearingTab
    ? revealStarters.get(appearingTab)?.progress
    : undefined;
  touchControl?.targets.set(progress ? [progress] : []);
}
export function attachIosTabTouchControl(control: IosTabTouchControl) {
  touchControl = control;
  publishTargets();
  return () => {
    if (touchControl === control) {
      touchControl = null;
    }
  };
}
export function registerIosTabReveal(
  tab: string,
  start: () => void,
  prepare: () => void = () => {},
  _settle: () => void = () => {},
  progress?: SharedValue<number>
) {
  const entry = { start, prepare, prepared: true, progress };
  revealStarters.set(tab, entry);
  publishTargets();
  return () => {
    if (revealStarters.get(tab) === entry) {
      revealStarters.delete(tab);
      if (appearingTab === tab) {
        appearingTab = null;
      }
      publishTargets();
    }
  };
}
export function startIosTabReveal(tab: string) {
  const entry = revealStarters.get(tab);
  // tabPress and onWillAppear describe the same selection, not two reveals.
  if (appearingTab === tab && !entry?.prepared) {
    return;
  }
  if (appearingTab !== null && appearingTab !== tab) {
    prepareIosTabReveal(appearingTab);
  }
  appearingTab = tab;
  if (entry) {
    entry.prepared = false;
    entry.start();
  }
  publishTargets();
}
export function prepareIosTabReveal(tab: string) {
  const entry = revealStarters.get(tab);
  if (entry && !entry.prepared) {
    entry.prepared = true;
    entry.prepare();
  }
}
