import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { authStorage } from '@/lib/auth-storage';
import { createPalette, DEFAULT_COLOR, normalizeHex } from '@/theme/palette';

export const PALETTE_STORAGE_KEY = 'nextstep-palette-v1';
const PaletteContext = createContext({
  savedColor: DEFAULT_COLOR,
  color: DEFAULT_COLOR,
  darkPalette: createPalette(DEFAULT_COLOR, true),
  lightPalette: createPalette(DEFAULT_COLOR, false),
  ready: false,
  loadError: false,
  preview: (_color: string | null) => {},
  save: async (_color: string) => {},
  retry: () => {},
});

export function PaletteProvider({ children }: PropsWithChildren) {
  const [savedColor, setSavedColor] = useState(DEFAULT_COLOR);
  const [draft, setDraft] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    setReady(false);
    authStorage
      .getItem(PALETTE_STORAGE_KEY)
      .then((stored) => {
        if (active) {
          setSavedColor(
            stored ? (normalizeHex(stored) ?? DEFAULT_COLOR) : DEFAULT_COLOR
          );
          setLoadError(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const preview = useCallback(
    (color: string | null) => setDraft(color ? normalizeHex(color) : null),
    []
  );
  const save = useCallback(
    async (color: string) => {
      const normalized = normalizeHex(color);
      if (!normalized || !ready || loadError || saving.current) {
        throw new Error('Palette unavailable');
      }
      saving.current = true;
      try {
        await authStorage.setItem(PALETTE_STORAGE_KEY, normalized);
        setSavedColor(normalized);
        setDraft(null);
      } finally {
        saving.current = false;
      }
    },
    [ready, loadError]
  );
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const color = draft ?? savedColor;
  const palettes = useMemo(
    () => ({
      darkPalette: createPalette(color, true),
      lightPalette: createPalette(color, false),
    }),
    [color]
  );
  const value = useMemo(
    () => ({
      savedColor,
      color,
      ...palettes,
      ready,
      loadError,
      preview,
      save,
      retry,
    }),
    [savedColor, color, palettes, ready, loadError, preview, save, retry]
  );
  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}
export const usePalettePreference = () => useContext(PaletteContext);
