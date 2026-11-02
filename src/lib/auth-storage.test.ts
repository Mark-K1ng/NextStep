import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authStorage } from './auth-storage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

it('persists a native session even without a browser window', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('session');
  await authStorage.setItem('token', 'session');
  expect(await authStorage.getItem('token')).toBe('session');
  await authStorage.removeItem('token');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'session');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('token');
});

it('uses browser storage on web without calling native modules', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const localStorage = { getItem: jest.fn(() => 'web-session'), setItem: jest.fn(), removeItem: jest.fn() };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage } });
  await authStorage.setItem('token', 'web-session');
  expect(await authStorage.getItem('token')).toBe('web-session');
  await authStorage.removeItem('token');
  expect(localStorage.setItem).toHaveBeenCalledWith('token', 'web-session');
  expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
});

it('does not touch browser storage during server rendering', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: undefined });
  expect(await authStorage.getItem('token')).toBeNull();
  await expect(authStorage.setItem('token', 'session')).resolves.toBeUndefined();
  await expect(authStorage.removeItem('token')).resolves.toBeUndefined();
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
});

it('surfaces persistence failures rather than pretending the session was saved', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('Keychain unavailable'));
  await expect(authStorage.setItem('token', 'session')).rejects.toThrow('Keychain unavailable');
});
