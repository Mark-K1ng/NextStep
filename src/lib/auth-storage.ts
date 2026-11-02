import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Native persistence must not depend on browser globals being available.
export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS !== 'web') {
      return SecureStore.getItemAsync(key);
    }
    if (typeof window === 'undefined') {
      return null;
    }
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS !== 'web') {
      return SecureStore.setItemAsync(key, value);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS !== 'web') {
      return SecureStore.deleteItemAsync(key);
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};
