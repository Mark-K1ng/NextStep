import { newGuestIntake, readGuestIntake } from './education';
import { installPkceCrypto } from '@/lib/pkce-crypto';

jest.mock('expo-crypto', () => {
  throw new Error("Cannot find native module 'ExpoCrypto'");
});
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
}));

const originalCrypto = globalThis.crypto;
afterEach(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: originalCrypto,
  });
});

it('loads the education service without native crypto and keeps secure draft creation guarded', async () => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: undefined,
  });
  expect(() => installPkceCrypto()).not.toThrow();
  await expect(readGuestIntake()).resolves.toBeNull();
  expect(() => newGuestIntake()).toThrow('Actualizează Expo Go');
});

it('uses existing secure UUID support without importing the absent native module', () => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { randomUUID: () => '11111111-1111-4111-8111-111111111111' },
  });
  expect(newGuestIntake().id).toBe('11111111-1111-4111-8111-111111111111');
});
