import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import { getDatabase } from './src/db/database';
import { colors } from './src/theme';
import { meetingIdFromResponse } from './src/services/notifications';
import type { RootStackParamList } from './src/navigation/types';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const handled = useRef<string | null>(null);

  // Tapping a meeting reminder opens that meeting.
  const openFromNotification = useCallback((response: Notifications.NotificationResponse | null) => {
    const meetingId = meetingIdFromResponse(response);
    if (!response || meetingId === null || !navigationRef.isReady()) return;
    const key = response.notification.request.identifier + response.notification.date;
    if (handled.current === key) return;
    handled.current = key;
    navigationRef.navigate('MeetingDetail', { meetingId });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    return () => sub.remove();
  }, [openFromNotification]);

  const onNavigationReady = useCallback(() => {
    if (Platform.OS === 'web') return;
    // Cold start from a notification tap.
    Notifications.getLastNotificationResponseAsync()
      .then(openFromNotification)
      .catch(() => undefined);
  }, [openFromNotification]);

  useEffect(() => {
    getDatabase()
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
