import { installPkceCrypto } from './pkce-crypto';
import * as ExpoCrypto from 'expo-crypto';
jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn((array) => {
    array.fill(7);
    return array;
  }),
  randomUUID: jest.fn(),
  digest: jest.fn(async () => new ArrayBuffer(32)),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));
beforeEach(() => {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: undefined,
  });
});
it('provides native secure randomness and SHA-256 for PKCE', async () => {
  installPkceCrypto();
  const bytes = new Uint8Array(8);
  expect(globalThis.crypto.getRandomValues(bytes)).toEqual(
    new Uint8Array(8).fill(7)
  );
  const input = new Uint8Array([1, 2, 3]);
  expect(
    (await globalThis.crypto.subtle.digest('SHA-256', input)).byteLength
  ).toBe(32);
  expect(ExpoCrypto.digest).toHaveBeenCalledWith('SHA-256', input);
});
it('does not replace an existing Web Crypto implementation', () => {
  const crypto = { getRandomValues: jest.fn(), subtle: { digest: jest.fn() } };
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: crypto,
  });
  installPkceCrypto();
  expect(globalThis.crypto).toBe(crypto);
});
