import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from './src/db/database';
import { configureNotifications, rescheduleAllReminders } from './src/notifications/notifications';
import { DataProvider } from './src/state/DataContext';
import { useTheme } from './src/theme/useTheme';
import { BASE_COLORS } from './src/theme/theme';
import { syncNow } from './src/api/sync';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

// Both must run before the first render / first scheduled notification.
initDatabase();
configureNotifications();

export type RootTabParamList = {
  Home: undefined;
  Insights: undefined;
  Reminders: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'water',
  Insights: 'stats-chart',
  Reminders: 'alarm',
  Settings: 'settings-sharp',
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BASE_COLORS.background,
    card: BASE_COLORS.card,
    text: BASE_COLORS.textPrimary,
    border: BASE_COLORS.border,
  },
};

function AppNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          animation: 'fade',
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: BASE_COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: BASE_COLORS.card,
            borderTopColor: BASE_COLORS.border,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Reminders" component={RemindersScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Reconcile OS notification schedule with the reminders table and push
    // any unsynced local data; both are safe no-ops offline.
    void rescheduleAllReminders();
    void syncNow();
  }, []);

  return (
    <SafeAreaProvider>
      <DataProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </DataProvider>
    </SafeAreaProvider>
  );
}
