import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import PoliciesScreen from '../screens/PoliciesScreen';
import PolicyFormScreen from '../screens/PolicyFormScreen';
import PolicyDetailScreen from '../screens/PolicyDetailScreen';
import PaymentFormScreen from '../screens/PaymentFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICON: Record<keyof TabParamList, string> = {
  Dashboard: '🏠',
  Clients: '👥',
  Policies: '📄',
  Settings: '⚙️',
};

function tabIcon(name: keyof TabParamList) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{TAB_ICON[name]}</Text>
  );
}

const screenHeader = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' as const },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenHeader,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Due reminders', tabBarIcon: tabIcon('Dashboard') }}
      />
      <Tab.Screen name="Clients" component={ClientsScreen} options={{ tabBarIcon: tabIcon('Clients') }} />
      <Tab.Screen name="Policies" component={PoliciesScreen} options={{ tabBarIcon: tabIcon('Policies') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: tabIcon('Settings') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={screenHeader}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: 'Client' }} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: 'Client' }} />
      <Stack.Screen name="PolicyForm" component={PolicyFormScreen} options={{ title: 'Policy' }} />
      <Stack.Screen name="PolicyDetail" component={PolicyDetailScreen} options={{ title: 'Policy' }} />
      <Stack.Screen name="PaymentForm" component={PaymentFormScreen} options={{ title: 'Record payment' }} />
    </Stack.Navigator>
  );
}
