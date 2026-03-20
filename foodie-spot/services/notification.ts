// =============================================================
// services/notification.ts
// Gestion des notifications push et locales
// Note : les push notifications (remote) ne fonctionnent pas
// dans Expo Go depuis SDK 53 → utiliser un development build
// Les notifications LOCALES fonctionnent dans Expo Go
// =============================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PushToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
  createdAt: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  tripReminders: boolean;
  newMessages: boolean;
  promotions: boolean;
  sound: boolean;
}

const KEYS = {
  PUSH_TOKEN: '@push_token',
  PREFERENCES: '@notification_prefs',
} as const;

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  tripReminders: true,
  newMessages: true,
  promotions: true,
  sound: true,
};

// Config : les notifications locales s'affichent même si l'app est au premier plan
// CORRECTION : shouldShowAlert est déprécié depuis SDK 53
// Ancien code : shouldShowAlert: true (déprécié → warning)
// CORRECTION : on utilise shouldShowBanner + shouldShowList à la place
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // remplace shouldShowAlert pour la bannière
    shouldShowList: true,    // affiche dans le centre de notifications
  }),
});

export const notifications = {

  async initialize(): Promise<PushToken | null> {
    const isSimulator = !Device.isDevice;

    // Demander les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission notifications non accordée');
      return null;
    }

    // Créer les canaux Android
    if (Platform.OS === 'android') {
      await this.createAndroidChannels();
    }

    // Sur simulateur ou Expo Go, on génère un token mock
    // Les notifications locales (programmées, badge) fonctionnent quand même
    const isExpoGo = Constants.appOwnership === 'expo';

    if (isSimulator || isExpoGo) {
      const mockToken: PushToken = {
        token: 'LOCAL_MOCK_TOKEN',
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.deviceName || 'Device',
        createdAt: Date.now(),
      };
      await AsyncStorage.setItem(KEYS.PUSH_TOKEN, JSON.stringify(mockToken));
      return mockToken;
    }

    // Sur appareil physique
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      const pushToken: PushToken = {
        token: tokenData.data,
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.deviceName || undefined,
        createdAt: Date.now(),
      };

      await AsyncStorage.setItem(KEYS.PUSH_TOKEN, JSON.stringify(pushToken));
      return pushToken;
    } catch (error) {
      // Dans Expo Go SDK 53+, les push tokens distants ne sont plus supportés
      // C'est normal, les notifications locales fonctionnent quand même
      console.warn('Push token non disponible (Expo Go) - notifications locales seulement');
      const fallbackToken: PushToken = {
        token: 'EXPO_GO_LOCAL_ONLY',
        platform: Platform.OS as 'ios' | 'android',
        deviceId: Device.deviceName || undefined,
        createdAt: Date.now(),
      };
      await AsyncStorage.setItem(KEYS.PUSH_TOKEN, JSON.stringify(fallbackToken));
      return fallbackToken;
    }
  },

  async createAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Commandes',
      importance: Notifications.AndroidImportance.HIGH,
    });
  },

  async getToken(): Promise<PushToken | null> {
    const stored = await AsyncStorage.getItem(KEYS.PUSH_TOKEN);
    return stored ? JSON.parse(stored) : null;
  },

  // Envoyer une notification locale immédiate
  async send(title: string, body: string, data?: Record<string, any>): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: 'default' },
      trigger: null, // null = immédiate
    });
  },

  // Programmer une notification à une date précise
  async schedule(title: string, body: string, date: Date, data?: Record<string, any>): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: 'default' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });
  },

  async scheduleTripReminder(id: string, title: string, date: Date, daysBefore = 1): Promise<string> {
    const reminderDate = new Date(date);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);
    reminderDate.setHours(9, 0, 0, 0);

    if (reminderDate <= new Date()) {
      console.warn('Date de rappel dans le passé, ignoré');
      return '';
    }

    return this.schedule(
      '✈️ Rappel de voyage',
      `Votre voyage "${title}" commence dans ${daysBefore} jour(s) !`,
      reminderDate,
      { id, type: 'trip_reminder' }
    );
  },

  async cancel(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async getScheduled(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  },

  async setBadge(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  async getBadge(): Promise<number> {
    return Notifications.getBadgeCountAsync();
  },

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const stored = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return stored ? JSON.parse(stored) : DEFAULT_PREFS;
  },

  async savePreferences(prefs: NotificationPreferences): Promise<void> {
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  },

  setupListeners(
    onReceived?: (notification: Notifications.Notification) => void,
    onTapped?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const receivedSub = Notifications.addNotificationReceivedListener((n) => {
      onReceived?.(n);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((r) => {
      onTapped?.(r);
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  },
};
