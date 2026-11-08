import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from '../components/Icon';
import DashboardScreen from '../screens/DashboardScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import PoliciesScreen from '../screens/PoliciesScreen';
import PolicyFormScreen from '../screens/PolicyFormScreen';
import PolicyDetailScreen from '../screens/PolicyDetailScreen';
import PaymentFormScreen from '../screens/PaymentFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors, IconName } from '../theme';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TAB_ICON: Record<keyof TabParamList, IconName> = {
  Dashboard: 'home',
  Clients: 'users',
  Policies: 'doc',
  Settings: 'cog',
};

function tabIcon(name: keyof TabParamList) {
  return ({ focused }: { focused: boolean }) => (
    <Icon
      name={TAB_ICON[name]}
      size={22}
      strokeWidth={focused ? 2.4 : 1.8}
      color={focused ? colors.black : colors.textFaint}
    />
  );
}

const screenHeader = {
  headerStyle: { backgroundColor: colors.black },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '800' as const },
  headerShadowVisible: false,
};

/** Top-bar person icon (as in the reference) that opens the agent's settings. */
function ProfileButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Agent settings"
      onPress={() => navigation.navigate('Tabs', { screen: 'Settings' })}
      style={{ paddingHorizontal: 16, paddingVertical: 6 }}
    >
      <Icon name="person" size={22} color={colors.white} />
    </TouchableOpacity>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenHeader,
        headerRight: () => <ProfileButton />,
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.divider },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Due reminders', tabBarLabel: 'Home', tabBarIcon: tabIcon('Dashboard') }}
      />
      <Tab.Screen name="Clients" component={ClientsScreen} options={{ tabBarIcon: tabIcon('Clients') }} />
      <Tab.Screen name="Policies" component={PoliciesScreen} options={{ tabBarIcon: tabIcon('Policies') }} />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: tabIcon('Settings'), headerRight: undefined }}
      />
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
