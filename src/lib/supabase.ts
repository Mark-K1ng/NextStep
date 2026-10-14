import { createClient } from "@supabase/supabase-js";

// Custom storage adapter for expo-secure-store
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window === "undefined") {
        return null;
      }
      if (window.localStorage) {
        return window.localStorage.getItem(key);
      }
      // Importăm modulul nativ doar pe mobil, la execuție
      const SecureStore = await import("expo-secure-store");
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("Error getting item from secure store:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      const SecureStore = await import("expo-secure-store");
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("Error setting item in secure store:", error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      if (window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      const SecureStore = await import("expo-secure-store");
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("Error removing item from secure store:", error);
    }
  },
};

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
