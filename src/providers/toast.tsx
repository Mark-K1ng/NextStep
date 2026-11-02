import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  type PropsWithChildren,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, type ToastProps } from '@/components/Toast';
type ToastType = NonNullable<ToastProps['type']>;
const ToastContext = createContext<(message: string, type?: ToastType) => void>(
  () => {}
);
export function ToastProvider({ children }: PropsWithChildren) {
  const [notice, setNotice] = useState<{
    message: string;
    type: ToastType;
    id: number;
  } | null>(null);
  const sequence = useRef(0);
  const show = useCallback((message: string, type: ToastType = 'success') => {
    sequence.current += 1;
    setNotice({ message, type, id: sequence.current });
  }, []);
  return (
    <ToastContext.Provider value={show}>
      <View style={styles.root}>
        {children}
        {notice && (
          <Toast
            key={notice.id}
            message={notice.message}
            type={notice.type}
            visible
            onHide={() =>
              setNotice((current) =>
                current?.id === notice.id ? null : current
              )
            }
          />
        )}
      </View>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
const styles = StyleSheet.create({ root: { flex: 1 } });
