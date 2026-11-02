import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authStorage } from '@/lib/auth-storage';

type ThemeMode = 'system' | 'light' | 'dark';
const ThemeContext = createContext<{
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
}>({ mode: 'system', setMode: () => {} });

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');
  useEffect(() => {
    let active = true;
    authStorage
      .getItem('nextstep-theme')
      .then((saved) => {
        if (
          active &&
          (saved === 'light' || saved === 'dark' || saved === 'system')
        ) {
          setMode(saved);
        }
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, []);
  const updateMode = (nextMode: ThemeMode) => {
    setMode(nextMode);
    authStorage.setItem('nextstep-theme', nextMode).catch(console.error);
  };
  return (
    <ThemeContext.Provider value={{ mode, setMode: updateMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemePreference = () => useContext(ThemeContext);
