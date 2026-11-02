import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useReducedMotion,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export interface AsciiTheme {
  foreground: string;
  accent: string;
  background: string;
  fontFamily?: string;
}
export const defaultAsciiTheme: AsciiTheme = {
  foreground: '#8C8796',
  accent: '#A78BFA',
  background: '#25232F',
};
interface Scope {
  theme: AsciiTheme;
  reduced: boolean;
  active: boolean;
  phase: SharedValue<number>;
  register(): () => void;
}
const Context = createContext<Scope | null>(null);

function useEnvironment(reducedMotion?: boolean, active = true) {
  const initialReduced = useReducedMotion();
  const [systemReduced, setSystemReduced] = useState(initialReduced);
  const [foreground, setForeground] = useState(
    AppState.currentState !== 'background' &&
      AppState.currentState !== 'inactive'
  );
  useEffect(() => {
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduced
    );
    const app = AppState.addEventListener('change', (state) =>
      setForeground(state === 'active')
    );
    return () => {
      motion.remove();
      app.remove();
    };
  }, []);
  return {
    reduced: reducedMotion ?? systemReduced,
    active: active && foreground,
  };
}
function useLoop(phase: SharedValue<number>, running: boolean) {
  useEffect(() => {
    cancelAnimation(phase);
    phase.set(0);
    if (running) {
      phase.set(
        withRepeat(
          withTiming(3600000, {
            duration: 3600000,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          }),
          -1
        )
      );
    }
    return () => cancelAnimation(phase);
  }, [phase, running]);
}

export function AsciiProvider({
  children,
  theme,
  reducedMotion,
  active = true,
}: PropsWithChildren<{
  theme?: Partial<AsciiTheme>;
  reducedMotion?: boolean;
  active?: boolean;
}>) {
  const { active: inForeground, reduced } = useEnvironment(
    reducedMotion,
    active
  );
  const [consumers, setConsumers] = useState(0);
  const clock = useSharedValue(0);
  const phase = useDerivedValue(() => Math.floor(clock.get() / 33) * 33);
  const register = useCallback(() => {
    setConsumers((count) => count + 1);
    return () => setConsumers((count) => Math.max(0, count - 1));
  }, []);
  useLoop(clock, consumers > 0 && inForeground && !reduced);
  const value = useMemo(
    () => ({
      theme: { ...defaultAsciiTheme, ...theme },
      active: inForeground,
      reduced,
      phase,
      register,
    }),
    [theme, inForeground, reduced, phase, register]
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useAsciiContext = () => useContext(Context);
/** One UI-thread clock per scope, with no per-cell subscriptions. */
export function useAsciiScope(animate = false) {
  const scope = useContext(Context);
  if (!scope) {
    throw new Error('Wrap ASCII components in AsciiProvider.');
  }
  const { active, reduced, register } = scope;
  useEffect(() => {
    if (animate && active && !reduced) {
      return register();
    }
    return undefined;
  }, [animate, active, reduced, register]);
  return scope;
}

/** Gate off-screen/focused work without creating another animation clock. */
export function AsciiActivity({
  active,
  children,
}: PropsWithChildren<{ active: boolean }>) {
  const parent = useAsciiContext();
  if (!parent) {
    return <AsciiProvider active={active}>{children}</AsciiProvider>;
  }
  return (
    <Context.Provider value={{ ...parent, active: parent.active && active }}>
      {children}
    </Context.Provider>
  );
}
