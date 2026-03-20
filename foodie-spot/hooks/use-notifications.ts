// hooks/use-notifications.ts
// expo-notifications n'est pas compatible avec Expo Go SDK 53
// Ce stub évite le crash au démarrage

export const useNotifications = (onReceived?: any, onTapped?: any) => ({
  pushToken: null,
  isLoading: false,
  hasPermission: false,
  preferences: null,
  scheduled: [],
  badgeCount: 0,
  initialize: async () => null,
  send: async (_title: string, _body: string, _data?: any) => '',
  schedule: async (_title: string, _body: string, _date: Date, _data?: any) => '',
  scheduleTripReminder: async (_id: string, _title: string, _date: Date) => '',
  cancel: async (_id: string) => {},
  cancelAll: async () => {},
  updatePreferences: async (_updates: any) => {},
  setBadgeCount: async (_count: number) => {},
  clearBadge: async () => {},
  refreshScheduled: async () => {},
});

export const useLastNotificationResponse = () => null;