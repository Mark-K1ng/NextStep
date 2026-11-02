import { createContext, useContext, useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

// Outside the app provider, use the most conservative motion setting.
const MotionContext = createContext(true);

export function MotionProvider({ children }: PropsWithChildren) {
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );
    return () => subscription.remove();
  }, []);
  return (
    <MotionContext.Provider value={reduced}>{children}</MotionContext.Provider>
  );
}

export const useMotionPreference = () => useContext(MotionContext);
