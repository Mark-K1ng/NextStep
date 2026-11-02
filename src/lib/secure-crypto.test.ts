import { installPkceCrypto } from './pkce-crypto';
import { secureRandomUUID } from './secure-crypto';

jest.mock('expo-crypto', () => {
  throw new Error("Cannot find native module 'ExpoCrypto'");
});

const originalCrypto = globalThis.crypto;
afterEach(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: originalCrypto,
  });
});

it('allows startup without ExpoCrypto but blocks secure operations', async () => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: undefined,
  });
  expect(() => installPkceCrypto()).not.toThrow();
  expect(() => crypto.getRandomValues(new Uint8Array(16))).toThrow(
    'Actualizează Expo Go'
  );
  await expect(
    crypto.subtle.digest('SHA-256', new Uint8Array([1]))
  ).rejects.toThrow('Actualizează Expo Go');
  expect(() => secureRandomUUID()).toThrow('Actualizează Expo Go');
});

it('uses existing Web Crypto without loading the missing native module', () => {
  const randomUUID = jest.fn(() => 'secure-uuid');
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { randomUUID },
  });
  expect(secureRandomUUID()).toBe('secure-uuid');
  expect(randomUUID).toHaveBeenCalledTimes(1);
});
