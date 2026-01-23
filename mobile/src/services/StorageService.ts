/**
 * Storage Service
 * Persistent local storage with encryption support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageOptions {
  encrypted?: boolean;
  expiresIn?: number; // milliseconds
}

interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

class StorageService {
  private prefix: string = '@content_requests_';

  /**
   * Set item in storage
   */
  async setItem<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<void> {
    try {
      const storageKey = this.prefix + key;
      const timestamp = Date.now();

      const item: StorageItem<T> = {
        value,
        timestamp,
        expiresAt: options.expiresIn ? timestamp + options.expiresIn : undefined,
      };

      const serialized = JSON.stringify(item);

      // TODO: Add encryption if options.encrypted is true
      // For now, store as plain JSON

      await AsyncStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.error(`StorageService: Error setting item "${key}"`, error);
      throw error;
    }
  }

  /**
   * Get item from storage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const storageKey = this.prefix + key;
      const serialized = await AsyncStorage.getItem(storageKey);

      if (!serialized) {
        return null;
      }

      const item: StorageItem<T> = JSON.parse(serialized);

      // Check if item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error(`StorageService: Error getting item "${key}"`, error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      const storageKey = this.prefix + key;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`StorageService: Error removing item "${key}"`, error);
      throw error;
    }
  }

  /**
   * Clear all items with the app prefix
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      console.error('StorageService: Error clearing storage', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter((key) => key.startsWith(this.prefix))
        .map((key) => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('StorageService: Error getting all keys', error);
      return [];
    }
  }

  /**
   * Check if item exists
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Get multiple items
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const storageKeys = keys.map((key) => this.prefix + key);
    const result: Record<string, T | null> = {};

    try {
      const items = await AsyncStorage.multiGet(storageKeys);

      items.forEach(([storageKey, serialized], index) => {
        const key = keys[index];
        if (serialized) {
          try {
            const item: StorageItem<T> = JSON.parse(serialized);

            // Check if item has expired
            if (item.expiresAt && Date.now() > item.expiresAt) {
              result[key] = null;
              this.removeItem(key); // Remove expired item
            } else {
              result[key] = item.value;
            }
          } catch {
            result[key] = null;
          }
        } else {
          result[key] = null;
        }
      });

      return result;
    } catch (error) {
      console.error('StorageService: Error getting multiple items', error);
      return result;
    }
  }

  /**
   * Set multiple items
   */
  async setMultiple<T>(
    items: Record<string, T>,
    options: StorageOptions = {}
  ): Promise<void> {
    const timestamp = Date.now();

    const pairs: [string, string][] = Object.entries(items).map(([key, value]) => {
      const storageKey = this.prefix + key;

      const item: StorageItem<T> = {
        value,
        timestamp,
        expiresAt: options.expiresIn ? timestamp + options.expiresIn : undefined,
      };

      return [storageKey, JSON.stringify(item)];
    });

    try {
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('StorageService: Error setting multiple items', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

export default StorageService;
