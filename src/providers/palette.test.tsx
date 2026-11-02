import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import {
  PaletteProvider,
  usePalettePreference,
  PALETTE_STORAGE_KEY,
} from './palette';
import { DEFAULT_COLOR } from '@/theme/palette';

const mockGet = jest.fn();
const mockSet = jest.fn();
jest.mock('@/lib/auth-storage', () => ({
  authStorage: {
    getItem: (...args: unknown[]) => mockGet(...args),
    setItem: (...args: unknown[]) => mockSet(...args),
  },
}));
let current: ReturnType<typeof usePalettePreference>;
function Probe() {
  current = usePalettePreference();
  return null;
}
beforeEach(() => {
  mockGet.mockReset().mockResolvedValue(null);
  mockSet.mockReset().mockResolvedValue(undefined);
});

it('restores a saved palette on a new mount, and discards an unsaved preview', async () => {
  mockGet.mockResolvedValue('#10b981');
  const root = createRoot();
  try {
    await act(async () =>
      root.render(createElement(PaletteProvider, null, createElement(Probe)))
    );
    expect(current.ready).toBe(true);
    expect(current.color).toBe('#10B981');
    await act(async () => current.preview('#FF0000'));
    expect(current.color).toBe('#FF0000');
    expect(current.savedColor).toBe('#10B981');
    await act(async () => current.preview(null));
    expect(current.color).toBe('#10B981');
    await act(async () => current.save(DEFAULT_COLOR));
    expect(mockSet).toHaveBeenCalledWith(PALETTE_STORAGE_KEY, DEFAULT_COLOR);
    expect(current.savedColor).toBe(DEFAULT_COLOR);
  } finally {
    await act(async () => root.unmount());
  }
});
it('keeps the saved color and draft on write failure, and supports retry', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(createElement(PaletteProvider, null, createElement(Probe)))
    );
    await act(async () => current.preview('#FF0000'));
    mockSet.mockRejectedValueOnce(new Error('storage full'));
    await act(async () => {
      await expect(current.save('#FF0000')).rejects.toThrow();
    });
    expect(current.color).toBe('#FF0000');
    expect(current.savedColor).toBe(DEFAULT_COLOR);
    await act(async () => current.save('#FF0000'));
    expect(current.savedColor).toBe('#FF0000');
  } finally {
    await act(async () => root.unmount());
  }
});
it('does not overwrite unread storage, then restores it on retry', async () => {
  mockGet.mockRejectedValueOnce(new Error('locked'));
  const root = createRoot();
  try {
    await act(async () =>
      root.render(createElement(PaletteProvider, null, createElement(Probe)))
    );
    expect(current.loadError).toBe(true);
    await act(async () => {
      await expect(current.save('#FF0000')).rejects.toThrow();
    });
    expect(mockSet).not.toHaveBeenCalled();
    mockGet.mockResolvedValue('#0000FF');
    await act(async () => current.retry());
    expect(current.loadError).toBe(false);
    expect(current.color).toBe('#0000FF');
  } finally {
    await act(async () => root.unmount());
  }
});
