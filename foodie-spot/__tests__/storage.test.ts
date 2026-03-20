/**
 * Tests unitaires — services/storage.ts
 * Vérifie que le wrapper AsyncStorage fonctionne correctement.
 */

// Mock AsyncStorage
const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => { mockStore[key] = value; }),
  getItem: jest.fn(async (key: string) => mockStore[key] ?? null),
  removeItem: jest.fn(async (key: string) => { delete mockStore[key]; }),
  clear: jest.fn(async () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
  getAllKeys: jest.fn(async () => Object.keys(mockStore)),
}));

import { storage, STORAGE_KEYS } from '../services/storage';

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  jest.clearAllMocks();
});

describe('storage.setItem / getItem', () => {
  it('stocke et récupère un objet JSON', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test' };
    await storage.setItem(STORAGE_KEYS.USER, user);
    const result = await storage.getItem<typeof user>(STORAGE_KEYS.USER);
    expect(result).toEqual(user);
  });

  it('stocke et récupère une chaîne de caractères', async () => {
    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'my-token-123');
    const result = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
    expect(result).toBe('my-token-123');
  });

  it('retourne null pour une clé inexistante', async () => {
    const result = await storage.getItem('cle_qui_nexiste_pas');
    expect(result).toBeNull();
  });
});

describe('storage.removeItem', () => {
  it('supprime une clé existante', async () => {
    await storage.setItem('test_key', 'value');
    await storage.removeItem('test_key');
    const result = await storage.getItem('test_key');
    expect(result).toBeNull();
  });
});

describe('storage.getAllKeys', () => {
  it('retourne toutes les clés stockées', async () => {
    await storage.setItem('key_a', 'a');
    await storage.setItem('key_b', 'b');
    const keys = await storage.getAllKeys();
    expect(keys).toContain('key_a');
    expect(keys).toContain('key_b');
  });
});

describe('STORAGE_KEYS', () => {
  it('contient toutes les clés requises', () => {
    expect(STORAGE_KEYS.AUTH_TOKEN).toBeDefined();
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBeDefined();
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBeDefined();
    expect(STORAGE_KEYS.USER).toBeDefined();
    expect(STORAGE_KEYS.CART).toBeDefined();
    expect(STORAGE_KEYS.RECENT_SEARCHES).toBeDefined();
    expect(STORAGE_KEYS.THEME_MODE).toBeDefined();
    expect(STORAGE_KEYS.ONBOARDING_DONE).toBeDefined();
  });
});
