import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'expo-router';

type Popup = {
  id: string;
  render(height: number): ReactNode;
  onDismiss(): void;
};
type Controls = {
  show(popup: Popup): void;
  update(popup: Popup): void;
  close(id: string): void;
  finish(id: string): void;
};
const ControlsContext = createContext<Controls | null>(null);
const ContentContext = createContext<Popup | null>(null);

export function SelectionPopupProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const current = useRef<Popup | null>(null);
  const closing = useRef(false);
  const [popup, setPopup] = useState<Popup | null>(null);
  const show = useCallback(
    (next: Popup) => {
      if (current.current) {
        return;
      }
      current.current = next;
      closing.current = false;
      setPopup(next);
      router.push('/selection-popup');
    },
    [router]
  );
  const update = useCallback((next: Popup) => {
    if (current.current?.id === next.id && !closing.current) {
      current.current = next;
      setPopup(next);
    }
  }, []);
  const close = useCallback(
    (id: string) => {
      if (current.current?.id !== id || closing.current) {
        return;
      }
      closing.current = true;
      router.back();
    },
    [router]
  );
  const finish = useCallback((id: string) => {
    if (current.current?.id !== id) {
      return;
    }
    const previous = current.current;
    current.current = null;
    closing.current = false;
    setPopup(null);
    previous.onDismiss();
  }, []);
  const controls = useMemo(
    () => ({ show, update, close, finish }),
    [show, update, close, finish]
  );
  return (
    <ControlsContext.Provider value={controls}>
      <ContentContext.Provider value={popup}>
        {children}
      </ContentContext.Provider>
    </ControlsContext.Provider>
  );
}

export function useSelectionPopupControls() {
  const controls = useContext(ControlsContext);
  if (!controls) {
    throw new Error('SelectionPopupProvider is missing');
  }
  return controls;
}
export const useSelectionPopupContent = () => useContext(ContentContext);
