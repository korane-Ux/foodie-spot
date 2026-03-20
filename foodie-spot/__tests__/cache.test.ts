/**
 * Tests unitaires — services/cache.ts
 * Vérifie la logique de cache avec TTL.
 */

const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, value: string) => { mockStore[key] = value; }),
  getItem: jest.fn(async (key: string) => mockStore[key] ?? null),
  removeItem: jest.fn(async (key: string) => { delete mockStore[key]; }),
  getAllKeys: jest.fn(async () => Object.keys(mockStore)),
  clear: jest.fn(async () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
}));

import { cache } from '../services/cache';

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe('cache.set / get', () => {
  it('stocke et récupère une valeur', async () => {
    const data = [{ id: '1', name: 'Restaurant A' }];
    await cache.set('restaurants', data);
    const result = await cache.get<typeof data>('restaurants');
    expect(result).toEqual(data);
  });

  it('retourne null pour une clé inexistante', async () => {
    const result = await cache.get('cle_inexistante');
    expect(result).toBeNull();
  });

  it('expire les données après le TTL', async () => {
    jest.useFakeTimers();
    const data = { test: true };
    await cache.set('test_key', data);

    // Avancer de 6 minutes (TTL = 5 min)
    jest.advanceTimersByTime(6 * 60 * 1000);

    // Simuler que Date.now() est avancé
    const realDateNow = Date.now.bind(global.Date);
    global.Date.now = jest.fn(() => realDateNow() + 6 * 60 * 1000);

    const result = await cache.get('test_key');
    expect(result).toBeNull();

    global.Date.now = realDateNow;
    jest.useRealTimers();
  });
});

describe('cache.clear', () => {
  it('supprime une clé spécifique', async () => {
    await cache.set('key1', 'value1');
    await cache.clear('key1');
    const result = await cache.get('key1');
    expect(result).toBeNull();
  });
});

describe('cache.clearAll', () => {
  it('supprime toutes les clés préfixées cache_', async () => {
    await cache.set('key1', 'v1');
    await cache.set('key2', 'v2');
    await cache.clearAll();
    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBeNull();
  });
});
