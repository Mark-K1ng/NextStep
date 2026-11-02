jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => require('expo-router').useRouter(),
}));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { DataExportPage, DeleteAccountPage } from './AccountDataPages';
import { PrivacyLinks } from './PrivacyPages';
import { ro } from '@/i18n/ro';

const mockExport = jest.fn();
const mockDelete = jest.fn();
const mockShare = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('@/services/account-data', () => ({
  exportMyData: (...args: unknown[]) => mockExport(...args),
  deleteMyAccount: (...args: unknown[]) => mockDelete(...args),
}));
jest.mock('@/lib/export-data', () => ({
  saveDataExport: (...args: unknown[]) => mockShare(...args),
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({
    session: { user: { id: 'owner', email: 'owner@example.com' } },
  }),
}));
jest.mock('@/providers/saved', () => ({
  useSaved: () => ({ items: [], ready: true, error: false, retry: jest.fn() }),
}));
jest.mock('@/providers/toast', () => ({ useToast: () => jest.fn() }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}));
jest.mock('react-native', () => ({
  Keyboard: { dismiss: jest.fn() },
  Modal: 'modal',
  View: 'view',
  ScrollView: 'scroll-view',
  StyleSheet: { create: (value: unknown) => value },
  Platform: { OS: 'android' },
}));
jest.mock('@/components', () => ({ Button: 'button', Input: 'input' }));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  BackHeader: 'header',
  Panel: 'panel',
  Copy: 'copy',
  Row: 'row',
}));
jest.mock('lucide-react-native', () => ({
  LockKeyhole: 'icon',
  FileText: 'icon',
  Download: 'icon',
  Trash2: 'icon',
}));

const button = (root: Root, label: string) =>
  root.container.queryAll(
    (node) => node.type === 'button' && node.props.children === label
  )[0];
const finalButton = (root: Root, label: string) =>
  root.container
    .queryAll((node) => node.type === 'button' && node.props.children === label)
    .at(-1)!;
beforeEach(() => jest.clearAllMocks());

it('opens a distinct internal page for every privacy action without a website URL', async () => {
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(PrivacyLinks)));
    const rows = root.container.queryAll((node) => node.type === 'row');
    expect(rows).toHaveLength(4);
    for (const row of rows) await act(async () => row.props.onPress());
    expect(mockPush.mock.calls).toEqual([
      ['/privacy'],
      ['/terms'],
      ['/data-export'],
      ['/delete-account'],
    ]);
  } finally {
    await act(async () => root.unmount());
  }
});

it('keeps export errors visible, permits retry and shares only after fetching data', async () => {
  const root = createRoot();
  try {
    mockExport
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({ userId: 'owner' });
    mockShare.mockResolvedValue(undefined);
    await act(async () => root.render(createElement(DataExportPage)));
    await act(async () =>
      button(root, ro.accountData.exportAction).props.onPress()
    );
    expect(mockShare).not.toHaveBeenCalled();
    expect(
      root.container.queryAll(
        (node) => node.props.accessibilityRole === 'alert'
      )
    ).toHaveLength(1);
    await act(async () =>
      button(root, ro.accountData.exportAction).props.onPress()
    );
    expect(mockShare).toHaveBeenCalledWith({ userId: 'owner' });
    expect(
      root.container.queryAll(
        (node) => node.props.accessibilityRole === 'alert'
      )
    ).toHaveLength(0);
  } finally {
    await act(async () => root.unmount());
  }
});

it('requires the typed word and a second confirmation; cancellation never deletes', async () => {
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(DeleteAccountPage)));
    expect(button(root, ro.accountData.deleteAction).props.disabled).toBe(true);
    const input = root.container.queryAll((node) => node.type === 'input')[0];
    await act(async () => input.props.onChangeText(ro.accountData.deleteWord));
    expect(button(root, ro.accountData.deleteAction).props.disabled).toBe(
      false
    );
    await act(async () =>
      button(root, ro.accountData.deleteAction).props.onPress()
    );
    expect(mockDelete).not.toHaveBeenCalled();
    expect(
      root.container.queryAll((node) => node.type === 'modal')
    ).toHaveLength(1);
    await act(async () => finalButton(root, ro.common.cancel).props.onPress());
    expect(
      root.container.queryAll((node) => node.type === 'modal')
    ).toHaveLength(0);
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    await act(async () =>
      button(root, ro.accountData.deleteAction).props.onPress()
    );
    mockDelete.mockRejectedValueOnce(new Error('Offline'));
    await act(async () =>
      finalButton(root, ro.accountData.deleteAction).props.onPress()
    );
    expect(
      root.container.queryAll((node) => node.type === 'modal')
    ).toHaveLength(0);
    expect(
      root.container.queryAll(
        (node) => node.props.accessibilityRole === 'alert'
      )
    ).toHaveLength(1);
    expect(mockReplace).not.toHaveBeenCalled();
    await act(async () => button(root, ro.common.cancel).props.onPress());
    expect(mockBack).toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('returns to login after confirmed deletion succeeds, using a mocked service', async () => {
  const root = createRoot();
  try {
    mockDelete.mockResolvedValueOnce(undefined);
    await act(async () => root.render(createElement(DeleteAccountPage)));
    const input = root.container.queryAll((node) => node.type === 'input')[0];
    await act(async () => input.props.onChangeText(ro.accountData.deleteWord));
    await act(async () =>
      button(root, ro.accountData.deleteAction).props.onPress()
    );
    await act(async () =>
      finalButton(root, ro.accountData.deleteAction).props.onPress()
    );
    expect(mockDelete).toHaveBeenCalledWith('owner', undefined);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  } finally {
    await act(async () => root.unmount());
  }
});

it('dismisses the final warning on Android Back without deleting or losing the typed confirmation', async () => {
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(DeleteAccountPage)));
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'input')[0]
        .props.onChangeText(ro.accountData.deleteWord)
    );
    await act(async () =>
      button(root, ro.accountData.deleteAction).props.onPress()
    );
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'modal')[0]
        .props.onRequestClose()
    );
    expect(mockDelete).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(
      root.container.queryAll((node) => node.type === 'modal')
    ).toHaveLength(0);
    expect(
      root.container.queryAll((node) => node.type === 'input')[0].props.value
    ).toBe(ro.accountData.deleteWord);
  } finally {
    await act(async () => root.unmount());
  }
});

it('blocks repeated confirmation and cancellation while deletion is pending', async () => {
  let finish!: () => void;
  mockDelete.mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finish = resolve;
    })
  );
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(DeleteAccountPage)));
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'input')[0]
        .props.onChangeText(ro.accountData.deleteWord)
    );
    await act(async () =>
      button(root, ro.accountData.deleteAction).props.onPress()
    );
    const confirm = finalButton(root, ro.accountData.deleteAction).props
      .onPress;
    await act(async () => {
      void confirm();
      void confirm();
    });
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(finalButton(root, ro.common.cancel).props.disabled).toBe(true);
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'modal')[0]
        .props.onRequestClose()
    );
    expect(
      root.container.queryAll((node) => node.type === 'modal')
    ).toHaveLength(1);
    await act(async () => {
      finish();
    });
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  } finally {
    await act(async () => root.unmount());
  }
});
