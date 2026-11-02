import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import {
  SelectionPopupProvider,
  useSelectionPopupContent,
  useSelectionPopupControls,
} from './selection-popup';

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
let controls: ReturnType<typeof useSelectionPopupControls>;
let content: ReturnType<typeof useSelectionPopupContent>;
function Fixture() {
  controls = useSelectionPopupControls();
  content = useSelectionPopupContent();
  return null;
}
beforeEach(() => jest.clearAllMocks());

it('updates an open popup without pushing another route and closes only once', async () => {
  const root = createRoot();
  const onDismiss = jest.fn();
  try {
    await act(async () =>
      root.render(
        createElement(SelectionPopupProvider, null, createElement(Fixture))
      )
    );
    await act(async () =>
      controls.show({ id: 'selector', render: () => 'initial', onDismiss })
    );
    await act(async () =>
      controls.update({ id: 'selector', render: () => 'searched', onDismiss })
    );
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith('/selection-popup');
    expect(content?.render(500)).toBe('searched');
    await act(async () => {
      controls.close('selector');
      controls.close('selector');
    });
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    await act(async () => {
      controls.finish('selector');
      controls.finish('selector');
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(content).toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});

it('handles native swipe dismissal and ignores a stale selector owner', async () => {
  const root = createRoot();
  const onDismiss = jest.fn();
  try {
    await act(async () =>
      root.render(
        createElement(SelectionPopupProvider, null, createElement(Fixture))
      )
    );
    await act(async () =>
      controls.show({ id: 'active', render: () => null, onDismiss })
    );
    await act(async () => {
      controls.close('stale');
      controls.finish('stale');
    });
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => controls.finish('active'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(content).toBeNull();
    expect(mockRouter.back).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
