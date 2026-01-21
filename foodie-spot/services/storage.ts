import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
            // log.debug(`Item set: ${key}`);
        } catch (error) {
            // log.error('Error setting item', error);
            throw error;
        }
    },
    async getItem<T>(key: string): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            // log.error('Error getting item', error);
            return null;
        }
    },
   async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
            // log.debug(`Item removed: ${key}`);
        } catch (error) {
            // log.error('Error removing item', error);
            throw error;
        }
    },
    async clear(): Promise<void> {
        try {
            await AsyncStorage.clear();
            // log.debug('Storage cleared');
        } catch (error) {
            // log.error('Error clearing storage', error);
            throw error;
        }
    },
    async getAllKeys(): Promise<string[]> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            return keys.map(key => key.replace('cache_', ''));
        } catch (error) {
            // log.error('Error getting all keys', error);
            return [];
        }
    }
};

export const STORAGE_KEYS = {
    USER: 'user',
    AUTH_TOKEN: 'authToken',
    CART: 'cart',
    FAVORITES: 'favorites',
    RECENT_SEARCHES: 'recentSearches',
    CACHED_RESTAURANTS: 'cachedRestaurants',
    OFFLINE_ORDERS: 'offlineOrders',
};