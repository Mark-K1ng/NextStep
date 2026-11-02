import { Platform } from 'react-native';
import { nativeCrypto } from './secure-crypto';
export function installPkceCrypto() {
  if (
    Platform.OS === 'web' ||
    (globalThis.crypto?.subtle?.digest && globalThis.crypto?.getRandomValues)
  ) {
    return;
  }
  // Supabase needs only secure random bytes and SHA-256 from Web Crypto for S256 PKCE.
  const existing = globalThis.crypto;
  const pkceCrypto = {
    ...existing,
    getRandomValues: existing?.getRandomValues
      ? existing.getRandomValues.bind(existing)
      : (array: Parameters<typeof import('expo-crypto').getRandomValues>[0]) =>
          nativeCrypto().getRandomValues(array),
    randomUUID: existing?.randomUUID
      ? existing.randomUUID.bind(existing)
      : () => nativeCrypto().randomUUID(),
    subtle: {
      async digest(algorithm: AlgorithmIdentifier, data: BufferSource) {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name.toUpperCase() !== 'SHA-256') {
          throw new Error('Unsupported PKCE digest');
        }
        const crypto = nativeCrypto();
        return crypto.digest(crypto.CryptoDigestAlgorithm.SHA256, data);
      },
    },
  };
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: pkceCrypto,
  });
}
