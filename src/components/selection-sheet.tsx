import { useEffect, useId, type ReactNode } from 'react';
import { useSelectionPopupControls } from '@/providers/selection-popup';

export type SelectionSheetProps = {
  isPresented: boolean;
  onDismiss(): void;
  children(height: number): ReactNode;
};

export function SelectionSheet({
  isPresented,
  onDismiss,
  children,
}: SelectionSheetProps) {
  const id = useId();
  const controls = useSelectionPopupControls();
  useEffect(() => {
    if (isPresented) {
      controls.show({ id, render: children, onDismiss });
    } else {
      controls.close(id);
    }
    return () => {
      controls.close(id);
    };
    // Content updates do not open a second sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresented, controls, id]);
  useEffect(() => {
    if (isPresented) {
      controls.update({ id, render: children, onDismiss });
    }
  }, [isPresented, controls, id, children, onDismiss]);
  return null;
}
