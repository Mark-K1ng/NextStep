// Load native crypto only when an operation needs it. Older development builds
// may lack ExpoCrypto; that must block the operation, not importing the app.
export function nativeCrypto(): typeof import('expo-crypto') {
  try {
    // A static import would throw before the app can mount in older builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-crypto') as typeof import('expo-crypto');
  } catch {
    throw new Error(
      'Criptografia securizată nu este disponibilă. Actualizează Expo Go sau reconstruiește aplicația de dezvoltare cu expo-crypto.'
    );
  }
}

export function secureRandomUUID(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : nativeCrypto().randomUUID();
}
