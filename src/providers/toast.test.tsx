import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { ToastProvider, useToast } from './toast';
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (value: unknown) => value },
}));
let mockNotice: { message: string; onHide(): void } | null;
jest.mock('@/components/Toast', () => ({
  Toast: (props: typeof mockNotice) => {
    mockNotice = props;
    return require('react').createElement('notice', props);
  },
}));
it('does not let an old toast callback dismiss a newer action confirmation', async () => {
  let show: ReturnType<typeof useToast>;
  function Observer() {
    show = useToast();
    return null;
  }
  const root = createRoot();
  try {
    await act(async () => {
      root.render(createElement(ToastProvider, null, createElement(Observer)));
    });
    await act(async () => {
      show!('added');
    });
    const hideOld = mockNotice!.onHide;
    await act(async () => {
      show!('removed');
    });
    const hideCurrent = mockNotice!.onHide;
    await act(async () => {
      hideOld();
    });
    expect(root.container.toJSON()).toMatchObject({
      children: [
        {
          type: 'view',
          children: [{ type: 'notice', props: { message: 'removed' } }],
        },
      ],
    });
    await act(async () => {
      hideCurrent();
    });
    expect(root.container.toJSON()).toMatchObject({
      children: [{ type: 'view', children: [] }],
    });
  } finally {
    await act(async () => {
      root.unmount();
    });
  }
});
