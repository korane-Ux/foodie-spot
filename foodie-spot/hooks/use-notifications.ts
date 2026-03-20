// =============================================================
// hooks/use-notifications.ts
// Hook pour gérer les notifications push
// =============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notifications, NotificationPreferences, PushToken } from '@/services/notification';

export function useNotifications(
  onReceived?: (notification: Notifications.Notification) => void,
  onTapped?: (data: any) => void
) {
  const [pushToken, setPushToken] = useState<PushToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);
  const [badgeCount, setBadgeCountState] = useState(0);

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    loadData();
    cleanupRef.current = notifications.setupListeners(
      (n) => onReceived?.(n),
      (r) => onTapped?.(r.notification.request.content.data)
    );
    return () => cleanupRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // CORRECTION : le code original avait un bug ici
      // Ancien code (bugué) :
      // const [token, prefs, badge, scheduledList] = await Promise.all([
      //   notifications.getToken(),
      //   notifications.getPreferences(),
      //   // notifications.getBadge(),   ← était commenté mais la destructuration attendait 4 valeurs !
      //   notifications.getScheduled(),
      // ]);
      // Résultat : 'badge' recevait la valeur de 'scheduledList' → bug silencieux
      //
      // CORRECTION : on fait 3 appels et on récupère getBadge séparément
      const [token, prefs, scheduledList] = await Promise.all([
        notifications.getToken(),
        notifications.getPreferences(),
        notifications.getScheduled(),
      ]);
      const badge = await notifications.getBadge().catch(() => 0);

      setPushToken(token);
      setPreferences(prefs);
      setScheduled(scheduledList);
      setBadgeCountState(badge);
      setHasPermission(!!token);
    } finally {
      setIsLoading(false);
    }
  };

  const initialize = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await notifications.initialize();
      if (token) {
        setPushToken(token);
        setHasPermission(true);
      }
      return token;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const send = useCallback((title: string, body: string, data?: any) => {
    return notifications.send(title, body, data);
  }, []);

  const schedule = useCallback(async (title: string, body: string, date: Date, data?: any) => {
    const id = await notifications.schedule(title, body, date, data);
    const list = await notifications.getScheduled();
    setScheduled(list);
    return id;
  }, []);

  const cancel = useCallback(async (id: string) => {
    await notifications.cancel(id);
    const list = await notifications.getScheduled();
    setScheduled(list);
  }, []);

  const cancelAll = useCallback(async () => {
    await notifications.cancelAll();
    setScheduled([]);
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      const current = preferences ?? (await notifications.getPreferences());
      const updated = { ...current, ...updates };
      await notifications.savePreferences(updated);
      setPreferences(updated);
    },
    [preferences]
  );

  const updateBadge = useCallback(async (count: number) => {
    await notifications.setBadge(count);
    setBadgeCountState(count);
  }, []);

  const clearBadge = useCallback(async () => {
    await notifications.clearBadge();
    setBadgeCountState(0);
  }, []);

  const refreshScheduled = useCallback(async () => {
    const list = await notifications.getScheduled();
    setScheduled(list);
  }, []);

  return {
    pushToken,
    isLoading,
    hasPermission,
    preferences,
    scheduled,
    badgeCount,
    initialize,
    send,
    schedule,
    cancel,
    cancelAll,
    updatePreferences,
    setBadgeCount: updateBadge,
    clearBadge,
    refreshScheduled,
  };
}

export function useLastNotificationResponse() {
  const [response, setResponse] = useState<Notifications.NotificationResponse | null>(null);
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) setResponse(r);
    });
  }, []);
  return response;
}
