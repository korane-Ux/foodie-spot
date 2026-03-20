// =============================================================
// hooks/use-offline.ts
// Hook pour détecter si l'utilisateur est connecté ou non
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { storage, STORAGE_KEYS } from '@/services/storage';
import { orderAPI } from '@/services/api';
import log from '@/services/logger';

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
  });

  const checkPendingActions = useCallback(async () => {
    try {
      const offlineOrders = await storage.getItem<any[]>(STORAGE_KEYS.OFFLINE_ORDERS);
      setState((prev) => ({
        ...prev,
        pendingCount: offlineOrders?.length ?? 0,
      }));
    } catch (error) {
      log.error('Erreur vérification actions en attente:', error);
    }
  }, []);

  const syncNow = useCallback(async () => {
    setState((prev) => {
      if (!prev.isOnline || prev.isSyncing || prev.pendingCount === 0) return prev;
      return { ...prev, isSyncing: true };
    });

    try {
      log.info('🔄 Synchronisation des données hors-ligne...');
      // CORRECTION : syncOfflineOrders n'existait pas dans le code original
      // Ancien code : await orderAPI.syncOfflineOrders(); → TypeScript error : not a function
      // J'ai implémenté la fonction dans services/api.ts
      await orderAPI.syncOfflineOrders();
      await checkPendingActions();
      log.info('✅ Synchronisation terminée');
    } catch (error) {
      log.error('❌ Erreur de synchronisation:', error);
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [checkPendingActions]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isConnected = netState.isConnected ?? false;
      setState((prev) => {
        if (!prev.isOnline && isConnected && prev.pendingCount > 0) {
          log.info('📶 Connexion retrouvée, synchronisation dans 1s...');
          setTimeout(() => syncNow(), 1000);
        }
        return { ...prev, isOnline: isConnected };
      });
    });

    NetInfo.fetch().then((netState) => {
      setState((prev) => ({ ...prev, isOnline: netState.isConnected ?? false }));
    });

    checkPendingActions();
    return () => unsubscribe();
  }, [checkPendingActions, syncNow]);

  useEffect(() => {
    const interval = setInterval(checkPendingActions, 30_000);
    return () => clearInterval(interval);
  }, [checkPendingActions]);

  return {
    isOnline: state.isOnline,
    pendingCount: state.pendingCount,
    isSyncing: state.isSyncing,
    syncNow,
    checkPendingActions,
  };
}

export default useOffline;
